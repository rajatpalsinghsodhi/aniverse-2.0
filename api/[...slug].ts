/**
 * Catch-all Vercel Function for /api/* — one bundle so shared in-memory state works per instance.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createAuthApp } from "../lib/auth/expressApp";

const app = createAuthApp();

function slugToApiPath(slug: string | string[] | undefined): string {
  if (slug == null) return "/api";
  if (Array.isArray(slug)) return "/api/" + slug.join("/");
  return "/api/" + slug;
}

export const config = {
  maxDuration: 60,
};

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const raw = req.url || "/";
  const pathOnly = raw.split("?")[0] ?? "";

  if (!(pathOnly.startsWith("/api/") || pathOnly === "/api")) {
    const slug = req.query.slug as string | string[] | undefined;
    const built = slugToApiPath(slug);
    try {
      const u = new URL(raw, "http://internal");
      const qs = u.searchParams.toString();
      req.url = built + (qs ? `?${qs}` : "");
    } catch {
      req.url = built;
    }
  }

  app(req as unknown as import("express").Request, res as unknown as import("express").Response);
}
