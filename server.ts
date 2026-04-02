import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3000;
const JWT_SECRET = "anime-discovery-secret-123";

// In-memory "database"
const users: any[] = [];
const libraries: Record<string, any[]> = {}; // userId -> animeList

function getBearerToken(req: express.Request): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

app.use(cors({ allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// --- API Routes ---

// Auth
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, username } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, username, password: hashedPassword };
  users.push(user);
  libraries[user.id] = [];
  
  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET);
  res.json({
    user: { id: user.id, email: user.email, username: user.username },
    token,
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET);
  res.json({
    user: { id: user.id, email: user.email, username: user.username },
    token,
  });
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

// Library
app.get("/api/library", authenticate, (req: any, res) => {
  res.json(libraries[req.user.id] || []);
});

app.post("/api/library/add", authenticate, (req: any, res) => {
  const { anime } = req.body;
  const userLib = libraries[req.user.id] || [];
  if (!userLib.find(a => a.mal_id === anime.mal_id)) {
    userLib.push({ ...anime, status: "plan_to_watch" });
    libraries[req.user.id] = userLib;
  }
  res.json(userLib);
});

app.post("/api/library/update", authenticate, (req: any, res) => {
  const { animeId, status } = req.body;
  const userLib = libraries[req.user.id] || [];
  const anime = userLib.find(a => a.mal_id === animeId);
  if (anime) {
    anime.status = status;
  }
  res.json(userLib);
});

app.post("/api/library/remove", authenticate, (req: any, res) => {
  const { animeId } = req.body;
  libraries[req.user.id] = (libraries[req.user.id] || []).filter(a => a.mal_id !== animeId);
  res.json(libraries[req.user.id]);
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
