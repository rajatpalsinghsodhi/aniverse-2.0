import { createAuthApp } from "./lib/expressApp";

let app: ReturnType<typeof createAuthApp> | null = null;

function getApp() {
  if (!app) app = createAuthApp();
  return app;
}

export default function handler(req: any, res: any) {
  try {
    getApp()(req, res);
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.split("\n").slice(0, 5) });
  }
}
