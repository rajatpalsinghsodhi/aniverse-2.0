/**
 * Parse API JSON without throwing; detect HTML error pages (Live Preview, missing API).
 */
export const LOCAL_DEV_STACK_MESSAGE =
  'Received a web page instead of API data. Run the full dev server: npm run dev (starts Express on port 3001 and Vite on 3000). Open http://localhost:3000. Do not use "vite" alone, Live Preview, or preview without the API.';

/** Shown when the deployed site gets HTML from /api/* (routing, missing env, or cold start). */
export const PRODUCTION_HTML_INSTEAD_OF_JSON_MESSAGE =
  "The API returned a web page instead of JSON. In Vercel: Project → Settings → Environment Variables — set JWT_SECRET (and optional Upstash for Redis), then redeploy. Check Deployments → Functions that /api is listed. In DevTools → Network, confirm POST /api/auth/signup responds with JSON, not HTML.";

/** Local Vite dev vs production build (e.g. Vercel). */
export function htmlInsteadOfJsonMessage(): string {
  return import.meta.env.DEV ? LOCAL_DEV_STACK_MESSAGE : PRODUCTION_HTML_INSTEAD_OF_JSON_MESSAGE;
}

export function parseApiJsonBody(
  raw: string,
  status: number
):
  | { ok: true; data: unknown }
  | { ok: false; message: string } {
  const trimmed = raw.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return {
      ok: false,
      message:
        status >= 400
          ? `Request failed (${status})`
          : "Empty response from server",
    };
  }
  const first = trimmed[0];
  if (first !== "{" && first !== "[") {
    return {
      ok: false,
      message: htmlInsteadOfJsonMessage(),
    };
  }
  try {
    return { ok: true, data: JSON.parse(trimmed) };
  } catch {
    return {
      ok: false,
      message: `Invalid response from server (HTTP ${status})`,
    };
  }
}
