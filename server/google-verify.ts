import { OAuth2Client } from "google-auth-library";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  "";

const client = new OAuth2Client(googleClientId);

export interface GooglePayload {
  id: string;
  email: string | null;
  name: string;
  picture?: string;
}

export async function verifyGoogleToken(token: string): Promise<GooglePayload> {
  if (!token) {
    throw Object.assign(new Error("Missing Google token"), { status: 400 });
  }

  // 1. Try verifying as a Google ID Token (JWT)
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId || undefined,
    });
    const payload = ticket.getPayload();
    if (payload) {
      return {
        id: payload.sub,
        email: payload.email?.toLowerCase().trim() || null,
        name:
          payload.name ||
          [payload.given_name, payload.family_name].filter(Boolean).join(" ") ||
          payload.email?.split("@")[0] ||
          "User",
        picture: payload.picture,
      };
    }
  } catch (_jwtError) {
    // If JWT verification fails, proceed to fallback for access tokens
  }

  // 2. Fallback: Verify as OAuth2 Access Token against Google UserInfo endpoint
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const info = (await res.json()) as {
        sub: string;
        email?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
      if (info.sub) {
        return {
          id: info.sub,
          email: info.email?.toLowerCase().trim() || null,
          name:
            info.name ||
            [info.given_name, info.family_name].filter(Boolean).join(" ") ||
            info.email?.split("@")[0] ||
            "User",
          picture: info.picture,
        };
      }
    }
  } catch (_apiError) {
    // Both verification methods failed
  }

  throw Object.assign(new Error("Invalid or expired Google authentication token. Please try again."), {
    status: 401,
  });
}
