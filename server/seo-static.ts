import type { Express } from "express";
import fs from "fs";
import path from "path";

const PUBLIC_PATHS = [
  path.resolve(process.cwd(), "client", "public"),
  path.resolve(process.cwd(), "dist", "public"),
];

function resolvePublicFile(filename: string): string | null {
  for (const dir of PUBLIC_PATHS) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Ensure robots.txt and sitemap.xml are always served as static text (not SPA HTML). */
export function registerSeoStaticRoutes(app: Express): void {
  app.get("/robots.txt", (_req, res) => {
    const file = resolvePublicFile("robots.txt");
    if (!file) {
      return res
        .type("text/plain")
        .send("User-agent: *\nAllow: /\nSitemap: https://www.xgoo.in/sitemap.xml\n");
    }
    res.type("text/plain").sendFile(file);
  });

  app.get("/sitemap.xml", (_req, res) => {
    const file = resolvePublicFile("sitemap.xml");
    if (!file) {
      return res.status(404).type("application/xml").send("<?xml version=\"1.0\"?><urlset></urlset>");
    }
    res.type("application/xml").sendFile(file);
  });

  app.get("/og-image.jpg", (_req, res, next) => {
    const file = resolvePublicFile("og-image.jpg");
    if (!file) return next();
    res.type("image/jpeg").sendFile(file);
  });
}
