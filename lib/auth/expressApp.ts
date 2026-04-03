import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { loadState, saveState, type AuthUser } from "./state";

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.VERCEL) {
      throw new Error("JWT_SECRET must be set in Vercel environment variables.");
    }
    return "dev-only-insecure-secret-change-me";
  }
  return s;
}

function getBearerToken(req: express.Request): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export function createAuthApp() {
  const app = express();

  const devOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://192.168.0.192:3000",
  ];
  app.use(
    cors({
      origin: process.env.VERCEL
        ? (origin, cb) => {
            if (!origin) return cb(null, true);
            if (origin.endsWith(".vercel.app")) return cb(null, true);
            const authOrigin = process.env.AUTH_ORIGIN;
            if (authOrigin && origin === authOrigin) return cb(null, true);
            const vercelUrl = process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "";
            if (vercelUrl && origin === vercelUrl) return cb(null, true);
            const branchUrl = process.env.VERCEL_BRANCH_URL
              ? `https://${process.env.VERCEL_BRANCH_URL}`
              : "";
            if (branchUrl && origin === branchUrl) return cb(null, true);
            return cb(null, false);
          }
        : devOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // vercel.json routes /api/* → /api?path=* so api/index.ts receives all API traffic.
  app.use((req, _res, next) => {
    if (!process.env.VERCEL) {
      next();
      return;
    }
    try {
      const u = new URL(req.url || "/", "http://internal");
      let pathParam = u.searchParams.get("path");
      if (!pathParam) {
        for (const key of u.searchParams.keys()) {
          if (key === "path" || key.startsWith("path")) {
            pathParam = u.searchParams.get(key);
            if (pathParam) break;
          }
        }
      }
      if (pathParam) {
        u.searchParams.delete("path");
        for (const key of [...u.searchParams.keys()]) {
          if (key.startsWith("path")) u.searchParams.delete(key);
        }
        const rest = u.searchParams.toString();
        req.url = "/api/" + pathParam + (rest ? `?${rest}` : "");
      }
    } catch {
      /* ignore malformed URL */
    }
    next();
  });

  app.use(express.json());

  // Vercel may strip the /api prefix when invoking the handler — restore so routes match.
  app.use((req, _res, next) => {
    const full = req.url ?? "";
    const q = full.includes("?") ? full.slice(full.indexOf("?")) : "";
    const pathOnly = full.split("?")[0] ?? "";
    if (pathOnly.startsWith("/api/") || pathOnly === "/api") {
      next();
      return;
    }
    if (pathOnly.startsWith("/auth/") || pathOnly.startsWith("/library")) {
      req.url = "/api" + pathOnly + q;
    }
    next();
  });

  type AuthedUser = { id: string; email: string; username: string };

  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    try {
      const decoded = jwt.verify(token, jwtSecret()) as AuthedUser;
      (req as express.Request & { user?: AuthedUser }).user = decoded;
      next();
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const { email, password, username } = req.body ?? {};
      const state = await loadState();
      if (state.users.find((u) => u.email === email)) {
        res.status(400).json({ message: "User already exists" });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user: AuthUser = {
        id: randomUUID(),
        email,
        username,
        password: hashedPassword,
      };
      state.users.push(user);
      state.libraries[user.id] = [];
      await saveState(state);
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        jwtSecret(),
        { expiresIn: "7d" }
      );
      res.json({
        user: { id: user.id, email: user.email, username: user.username },
        token,
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body ?? {};
      const state = await loadState();
      const user = state.users.find((u) => u.email === email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(400).json({ message: "Invalid credentials" });
        return;
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        jwtSecret(),
        { expiresIn: "7d" }
      );
      res.json({
        user: { id: user.id, email: user.email, username: user.username },
        token,
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticate, (req, res) => {
    const u = (req as express.Request & { user?: AuthedUser }).user;
    res.json({ user: u });
  });

  app.get("/api/library", authenticate, async (req, res, next) => {
    try {
      const uid = (req as express.Request & { user: AuthedUser }).user.id;
      const state = await loadState();
      res.json(state.libraries[uid] || []);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/library/add", authenticate, async (req, res, next) => {
    try {
      const uid = (req as express.Request & { user: AuthedUser }).user.id;
      const { anime } = req.body ?? {};
      const state = await loadState();
      const userLib = (state.libraries[uid] || []) as { mal_id?: number }[];
      if (!userLib.find((a) => a.mal_id === anime?.mal_id)) {
        userLib.push({ ...anime, status: "plan_to_watch" });
        state.libraries[uid] = userLib;
        await saveState(state);
      }
      res.json(state.libraries[uid] || []);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/library/update", authenticate, async (req, res, next) => {
    try {
      const uid = (req as express.Request & { user: AuthedUser }).user.id;
      const { animeId, status } = req.body ?? {};
      const state = await loadState();
      const userLib = (state.libraries[uid] || []) as { mal_id?: number; status?: string }[];
      const anime = userLib.find((a) => a.mal_id === animeId);
      if (anime) anime.status = status;
      await saveState(state);
      res.json(state.libraries[uid] || []);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/library/remove", authenticate, async (req, res, next) => {
    try {
      const uid = (req as express.Request & { user: AuthedUser }).user.id;
      const { animeId } = req.body ?? {};
      const state = await loadState();
      state.libraries[uid] = (state.libraries[uid] || []).filter(
        (a: { mal_id?: number }) => a.mal_id !== animeId
      );
      await saveState(state);
      res.json(state.libraries[uid] || []);
    } catch (e) {
      next(e);
    }
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Not found", path: req.url });
  });

  app.use(
    (err: Error & { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.statusCode ?? 500;
      res.status(status).json({ message: err.message || "Server error" });
    }
  );

  return app;
}
