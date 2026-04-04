/**
 * Vercel serverless entry: load the pre-built Express app from `dist/index.cjs`
 * (output of `npm run build` / esbuild in script/build.ts).
 *
 * Do not import `../server/index` here — Vercel only ships this file as a function;
 * `server/*.ts` is not available at `/var/task/server/index` at runtime.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Express } from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const bundlePath = join(__dirname, "..", "dist", "index.cjs");
const mod = require(bundlePath) as { app: Express };
export default mod.app;
