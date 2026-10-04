declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
    __APP_CONFIG__?: {
      VITE_GOOGLE_CLIENT_ID?: string;
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_DEFAULT_OFFICE_SLUG?: string;
      VITE_SITE_URL?: string;
      VITE_META_PIXEL_ID?: string;
      VITE_WHATSAPP_NUMBER?: string;
    };
  }
}

let scriptLoadedPromise: Promise<void> | null = null;

export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts) return Promise.resolve();
  if (scriptLoadedPromise) return scriptLoadedPromise;

  scriptLoadedPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return scriptLoadedPromise;
}

export function getGoogleClientId(): string {
  if (typeof window !== "undefined" && window.__APP_CONFIG__?.VITE_GOOGLE_CLIENT_ID) {
    return window.__APP_CONFIG__.VITE_GOOGLE_CLIENT_ID.trim();
  }
  const envVal = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID;
  return (typeof envVal === "string" ? envVal.trim() : "") || "";
}

/**
 * Initiates Google OAuth popup and returns the authentication token (ID Token or Access Token).
 */
export async function triggerGoogleSignIn(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error(
      "Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment.",
    );
  }

  await loadGoogleScript();

  const google = window.google;
  if (!google?.accounts) {
    throw new Error("Failed to load Google Identity Services SDK.");
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    // Use OAuth2 token client for a reliable browser popup flow
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (resp) => {
          if (resolved) return;
          resolved = true;
          if (resp.error) {
            reject(new Error(resp.error));
          } else if (resp.access_token) {
            resolve(resp.access_token);
          } else {
            reject(new Error("No token received from Google"));
          }
        },
        error_callback: (err) => {
          if (resolved) return;
          resolved = true;
          reject(err instanceof Error ? err : new Error("Google popup closed or blocked"));
        },
      });

      tokenClient.requestAccessToken();
    } catch (_e) {
      // Fallback to Google ID Token initialize + prompt
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (resolved) return;
            resolved = true;
            if (response.credential) {
              resolve(response.credential);
            } else {
              reject(new Error("No credential returned by Google"));
            }
          },
        });
        google.accounts.id.prompt();
      } catch (promptError) {
        reject(promptError);
      }
    }
  });
}
