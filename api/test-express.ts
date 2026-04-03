import express from "express";

const app = express();
app.use(express.json());
app.all("*", (_req, res) => {
  res.json({ ok: true, path: _req.url, method: _req.method });
});

export default app;
