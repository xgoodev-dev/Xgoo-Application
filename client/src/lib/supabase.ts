import { createClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_DEFAULT_OFFICE_SLUG?: string;
      VITE_SITE_URL?: string;
      VITE_META_PIXEL_ID?: string;
      VITE_WHATSAPP_NUMBER?: string;
    };
  }
}

function getPublicConfig(key: keyof NonNullable<Window["__APP_CONFIG__"]>): string {
  if (typeof window !== "undefined" && window.__APP_CONFIG__?.[key]) {
    return window.__APP_CONFIG__[key]?.trim() || "";
  }
  const envVal = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
  return (typeof envVal === "string" ? envVal.trim() : "") || "";
}

const supabaseUrl = getPublicConfig("VITE_SUPABASE_URL");
const supabaseAnonKey = getPublicConfig("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) are set.",
  );
}

/**
 * PKCE matches Supabase + Google OAuth for browser apps. The default
 * `implicit` flow often breaks or is rejected; PKCE exchanges `?code=` on return.
 */
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
