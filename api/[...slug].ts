let app: any = null;
let initError: string | null = null;

export default async function handler(req: any, res: any) {
  if (!app && !initError) {
    try {
      const { createAuthApp } = await import("../lib/auth/expressApp.js");
      app = createAuthApp();
    } catch (e: any) {
      initError = e.stack || e.message || String(e);
      console.error("INIT ERROR:", initError);
    }
  }
  if (initError) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 500;
    res.end(JSON.stringify({ initError }));
    return;
  }
  app(req, res);
}
