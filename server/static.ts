import express, { type Express } from "express";
import fs from "fs";
import path from "path";

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

  const sendHtmlWithConfig = (_req: express.Request, res: express.Response) => {
    try {
      let html = fs.readFileSync(indexPath, "utf-8");

      const publicConfig = {
        VITE_SUPABASE_URL:
          process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
        VITE_SUPABASE_ANON_KEY:
          process.env.VITE_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          "",
        VITE_GOOGLE_CLIENT_ID:
          process.env.VITE_GOOGLE_CLIENT_ID ||
          process.env.GOOGLE_CLIENT_ID ||
          "",
        VITE_DEFAULT_OFFICE_SLUG:
          process.env.VITE_DEFAULT_OFFICE_SLUG ||
          process.env.DEFAULT_OFFICE_SLUG ||
          "demo-office",
        VITE_SITE_URL:
          process.env.VITE_SITE_URL ||
          process.env.PUBLIC_APP_URL ||
          "https://www.xgoo.in",
        VITE_META_PIXEL_ID: process.env.VITE_META_PIXEL_ID || "",
        VITE_WHATSAPP_NUMBER: process.env.VITE_WHATSAPP_NUMBER || "",
      };

      const configScript = `<script>window.__APP_CONFIG__ = ${JSON.stringify(publicConfig)};</script>`;
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${configScript}</head>`);
      } else {
        html = `${configScript}${html}`;
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err) {
      console.error("Error serving index.html:", err);
      res.sendFile(indexPath);
    }
  };

  app.get("/", sendHtmlWithConfig);
  app.get("/index.html", sendHtmlWithConfig);

  // Fallback for all client-side SPA routes
  app.use("/{*path}", sendHtmlWithConfig);
}
