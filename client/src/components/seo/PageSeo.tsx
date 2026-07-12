import { useEffect } from "react";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  type PageSeoConfig,
} from "@/lib/seo";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

type PageSeoProps = PageSeoConfig & {
  jsonLd?: unknown | unknown[];
};

/**
 * Client-side SEO head manager for the SPA.
 * Updates title, description, canonical, Open Graph, Twitter, and optional JSON-LD.
 */
export function PageSeo({
  title,
  description,
  path,
  noIndex = false,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  keywords,
  jsonLd,
}: PageSeoProps) {
  const jsonLdKey = JSON.stringify(jsonLd ?? null);

  useEffect(() => {
    const url = absoluteUrl(path);
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    if (keywords?.length) {
      upsertMeta("name", "keywords", keywords.join(", "));
    }

    upsertLink("canonical", url);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:site_name", "XGoo");
    upsertMeta("property", "og:locale", "en_IN");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    const parsed = jsonLdKey === "null" ? null : (JSON.parse(jsonLdKey) as unknown);
    const blocks = parsed == null ? [] : Array.isArray(parsed) ? parsed : [parsed];
    blocks.forEach((block, index) => {
      upsertJsonLd(`xgoo-jsonld-${index}`, block);
    });

    return () => {
      blocks.forEach((_, index) => removeJsonLd(`xgoo-jsonld-${index}`));
    };
  }, [title, description, path, noIndex, image, type, keywords, jsonLdKey]);

  return null;
}
