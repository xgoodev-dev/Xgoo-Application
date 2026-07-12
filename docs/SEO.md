# SEO

XGoo public SEO setup:

| Asset | Purpose |
|-------|---------|
| `client/index.html` | Default title, description, Open Graph, Twitter, canonical |
| `client/public/robots.txt` | Crawl rules + sitemap link |
| `client/public/sitemap.xml` | Indexable public URLs |
| `client/public/og-image.jpg` | Social share image |
| `client/src/lib/seo.ts` | Page SEO config + JSON-LD builders |
| `client/src/components/seo/PageSeo.tsx` | Per-route head updates in the SPA |
| `server/seo-static.ts` | Serves robots/sitemap/og-image without SPA fallback |

Optional env: `VITE_SITE_URL=https://www.xgoo.in` (defaults to `https://www.xgoo.in`).

After deploy, submit `https://www.xgoo.in/sitemap.xml` in Google Search Console.
