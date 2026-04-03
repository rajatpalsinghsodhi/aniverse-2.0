export default async function handler(_req: any, res: any) {
  const results: Record<string, string> = {};
  try { await import("express"); results.express = "ok"; } catch (e: any) { results.express = e.message; }
  try { await import("cors"); results.cors = "ok"; } catch (e: any) { results.cors = e.message; }
  try { await import("jsonwebtoken"); results.jwt = "ok"; } catch (e: any) { results.jwt = e.message; }
  try { await import("bcryptjs"); results.bcryptjs = "ok"; } catch (e: any) { results.bcryptjs = e.message; }
  try { await import("@upstash/redis"); results.upstash = "ok"; } catch (e: any) { results.upstash = e.message; }
  try { const { randomUUID } = await import("node:crypto"); results.crypto = randomUUID() ? "ok" : "no"; } catch (e: any) { results.crypto = e.message; }
  res.status(200).json(results);
}
