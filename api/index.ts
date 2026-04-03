/**
 * Vercel serverless entry: all /api/* traffic is rewritten here (see vercel.json).
 * Use an explicit Node handler so Express is always invoked (not only Web fetch export).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createAuthApp } from "../lib/auth/expressApp";

const app = createAuthApp();

export default function handler(req: VercelRequest, res: VercelResponse): void {
  app(req as unknown as import("express").Request, res as unknown as import("express").Response);
}
