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
        `Run both servers: npm run dev (Vite + Express on :3001).`
    );
    return null;
  }
}
