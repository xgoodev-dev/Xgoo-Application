/** Browser-safe values injected as window.__APP_CONFIG__ (same pattern as Google Client ID). */
export function getPublicAppConfig() {
  return {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    VITE_SUPABASE_ANON_KEY:
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
    VITE_GOOGLE_MAPS_API_KEY:
      process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_MAPS_API_KEY?.trim() || "",
    VITE_DEFAULT_OFFICE_SLUG:
      process.env.VITE_DEFAULT_OFFICE_SLUG || process.env.DEFAULT_OFFICE_SLUG || "demo-office",
    VITE_SITE_URL: process.env.VITE_SITE_URL || process.env.PUBLIC_APP_URL || "https://www.xgoo.in",
    VITE_META_PIXEL_ID: process.env.VITE_META_PIXEL_ID || "",
    VITE_WHATSAPP_NUMBER: process.env.VITE_WHATSAPP_NUMBER || "",
  };
}

export function injectPublicAppConfig(html: string): string {
  const configScript = `<script>window.__APP_CONFIG__ = ${JSON.stringify(getPublicAppConfig())};</script>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${configScript}</head>`);
  }
  return `${configScript}${html}`;
}
