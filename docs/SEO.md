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

## Courier route landing pages

Route pages are data-driven. To add a destination (for example Germany):

1. Add a unique record to `client/src/components/marketing/courier-routes/destinations.ts`.
2. Add the URL to `client/public/sitemap.xml` and an `Allow` line in `client/public/robots.txt`.
3. Link it from related slugs on nearby countries if useful.

No new page component is required. URLs follow `/courier-from-hyderabad-to-{slug}`.

Hub pages: `/international-courier`, `/domestic-courier`.
