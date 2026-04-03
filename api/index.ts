/**
 * Single API entry for Vercel. Subpaths are routed here via vercel.json rewrite:
 * /api/(.*) → /api?path=$1
 */
import { createAuthApp } from "../lib/auth/expressApp";

const app = createAuthApp();
export default app;
