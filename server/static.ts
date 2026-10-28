import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { injectPublicAppConfig } from "./public-app-config";
import { injectStoreShareMeta } from "./store-share-meta";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets with index: false so index.html goes through dynamic injection
  app.use(express.static(distPath, { index: false }));

  const indexPath = path.resolve(distPath, "index.html");

  const sendHtmlWithConfig = (req: express.Request, res: express.Response) => {
    void (async () => {
      try {
        const html = await injectStoreShareMeta(
          injectPublicAppConfig(fs.readFileSync(indexPath, "utf-8")),
          req,
        );
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
      } catch (err) {
        console.error("Error serving index.html:", err);
        res.sendFile(indexPath);
      }
    })();
  };

  app.get("/", sendHtmlWithConfig);
  app.get("/index.html", sendHtmlWithConfig);

  // Fallback for all client-side SPA routes
  app.use("/{*path}", sendHtmlWithConfig);
}
