import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { registerSeoStaticRoutes } from "./seo-static";
import { createServer } from "http";
import { pool } from "./db";

// export app so that api/index.ts can consume it for Vercel Serverless Functions
export const app = express();
const httpServer = createServer(app);

// Enable trust proxy for reverse proxies (Dokploy, Traefik, Nginx)
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS handling for API requests (Mobile app, Chrome extension, partner sync)
app.use("/api", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-pickup-token, x-autofill-token",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

function isMultipart(req: Request): boolean {
  const ct = req.headers["content-type"] || "";
  return ct.includes("multipart/form-data");
}

app.use((req, res, next) => {
  if (isMultipart(req)) return next();
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })(req, res, next);
});

app.use((req, res, next) => {
  if (isMultipart(req)) return next();
  express.urlencoded({ extended: false })(req, res, next);
});

// Serve local uploads
app.use("/objects", express.static("uploads"));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  registerSeoStaticRoutes(app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // On Vercel, static files are served by the CDN — don't try to serve them
  // from inside the serverless function (dist/public doesn't exist there)
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    serveStatic(app);
  } else if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  if (!process.env.VERCEL) {
    const port = parseInt(process.env.PORT || "3005", 10);
    const onListening = (label: string) => {
      log(`serving ${label} on port ${port}`);
    };

    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      onListening("http://0.0.0.0");
    });

    // Graceful shutdown handling for Docker / Dokploy
    let isShuttingDown = false;
    const gracefulShutdown = (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      log(`Received ${signal}, shutting down gracefully...`);

      httpServer.close(() => {
        log("HTTP server closed.");
        pool.end().then(() => {
          log("Database pool closed.");
          process.exit(0);
        }).catch((err) => {
          console.error("Error closing database pool:", err);
          process.exit(0);
        });
      });

      // Force shutdown after timeout if connections hang
      setTimeout(() => {
        log("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Optional IPv6 loopback on Windows development environments
    if (process.platform === "win32") {
      const ipv6Loopback = createServer(app);
      ipv6Loopback.on("upgrade", (req, socket, head) => {
        httpServer.emit("upgrade", req, socket, head);
      });
      ipv6Loopback.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EAFNOSUPPORT" || err.code === "EADDRNOTAVAIL" || err.code === "EADDRINUSE") {
          return;
        }
      });
      try {
        ipv6Loopback.listen({ port, host: "::1", ipv6Only: true }, () => {
          onListening("http://localhost");
        });
      } catch {
        // Ignore IPv6 errors on unsupported systems
      }
    }
  }
})();
