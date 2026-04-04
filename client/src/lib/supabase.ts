import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

/**
 * PKCE matches Supabase + Google OAuth for browser apps. The default
 * `implicit` flow often breaks or is rejected; PKCE exchanges `?code=` on return.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
    },
});
