import type { Request } from "express";
import { getPublicStorefront } from "./business-courier";

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function requestOrigin(req: Request) {
  const forwarded = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const proto = forwarded || req.protocol || "https";
  const host = req.get("host") || "www.xgoo.in";
  if (host.includes("localhost") || host.startsWith("127.") || host.startsWith("192.168.")) {
    return "https://www.xgoo.in";
  }
  return `${proto}://${host}`.replace(/\/$/, "");
}

function absoluteAsset(origin: string, pathOrUrl: string | null | undefined) {
  const value = pathOrUrl?.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}

function replaceMeta(html: string, attr: "property" | "name", key: string, content: string) {
  const safe = escapeAttr(content);
  const re = new RegExp(
    `(<meta[^>]*${attr}=["']${key}["'][^>]*content=["'])[^"']*(["'][^>]*>)`,
    "i",
  );
  if (re.test(html)) return html.replace(re, `$1${safe}$2`);
  return html.replace(
    "</head>",
    `    <meta ${attr}="${key}" content="${safe}" />\n  </head>`,
  );
}

function storeIdFromPath(path: string) {
  const match = path.split("?")[0].match(/^\/s\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function injectStoreShareMeta(html: string, req: Request): Promise<string> {
  const storeId = storeIdFromPath(req.path || req.url || "");
  if (!storeId) return html;
  try {
    const store = await getPublicStorefront(storeId);
    const origin = requestOrigin(req);
    const url = `${origin}/s/${encodeURIComponent(store.id)}`;
    const title = `${store.storeName} · XGoo`;
    const description = `Add your delivery address for your order from ${store.storeName}. Pickup and tracking with XGoo.`;
    const image =
      absoluteAsset(origin, store.logoUrl) || `${origin}/og-image.jpg`;
    let next = html;
    next = next.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(title)}</title>`);
    next = replaceMeta(next, "property", "og:title", title);
    next = replaceMeta(next, "property", "og:description", description);
    next = replaceMeta(next, "property", "og:url", url);
    next = replaceMeta(next, "property", "og:image", image);
    next = replaceMeta(next, "property", "og:image:alt", `${store.storeName} and XGoo`);
    next = replaceMeta(next, "name", "twitter:title", title);
    next = replaceMeta(next, "name", "twitter:description", description);
    next = replaceMeta(next, "name", "twitter:image", image);
    next = replaceMeta(next, "name", "description", description);
    return next;
  } catch {
    return html;
  }
}
