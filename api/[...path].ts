import { createApp } from "../server/app.js";

// Vercel Serverless Function entrypoint: catches every /api/* request and
// hands it to the shared Express app (same routes used by server/index.ts
// for local dev / self-hosted `pnpm start`). No static file serving here —
// the client build is served separately by Vercel's static output.
export default createApp();
