import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3001;
const JWT_SECRET = "anime-discovery-secret-123";

const users: any[] = [];
const libraries: Record<string, any[]> = {};

app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://192.168.0.192:3000"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

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
  res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
  res.json({ user: { id: user.id, email: user.email, username: user.username } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET);
  res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });
  res.json({ user: { id: user.id, email: user.email, username: user.username } });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

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
  if (anime) anime.status = status;
  res.json(userLib);
});

app.post("/api/library/remove", authenticate, (req: any, res) => {
  libraries[req.user.id] = (libraries[req.user.id] || []).filter(a => a.mal_id !== req.body.animeId);
  res.json(libraries[req.user.id]);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
