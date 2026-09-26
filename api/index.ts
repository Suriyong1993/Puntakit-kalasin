import { createApp } from "../server/app.js";

// Vercel Serverless Function entrypoint: handles every /api/* request via
// vercel.json's rewrite and hands it to the shared Express app (same routes
// used by server/index.ts for local dev / self-hosted `pnpm start`). No
// static file serving here — the client build is served separately by
// Vercel's static output.
//
// Named api/index.ts (not the api/[...path].ts catch-all convention)
// because Vercel's zero-config catch-all bracket routing only generated a
// single-segment route (matches /api/health, not /api/auth/me) for this
// project — the explicit rewrite below is the reliable way to route every
// /api/* request to one Express app regardless of path depth.
export default createApp();
