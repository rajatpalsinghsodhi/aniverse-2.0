/**
 * Use instead of res.json() for /api/* calls so HTML error pages (404, Live Preview,
 * missing proxy) don't throw SyntaxError: Unexpected token ...
 */
export async function parseJsonResponse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    console.warn(
      `[api] Expected JSON, got non-JSON (${res.status}). ` +
        (import.meta.env.DEV
          ? "Run npm run dev and open http://localhost:3000 (Vite proxies /api to Express on :3001)."
          : "On Vercel: check /api routes, JWT_SECRET, and redeploy.")
    );
    return null;
  }
}
