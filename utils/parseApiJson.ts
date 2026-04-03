/**
 * Parse API JSON without throwing; detect HTML error pages (Live Preview, missing API).
 */
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
      message:
        'Received a web page instead of API data. Run the full dev server: npm run dev (starts Express on port 3001 and Vite on 3000). Do not use "vite" alone, Live Preview, or preview without the API.',
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
