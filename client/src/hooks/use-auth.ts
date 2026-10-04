import { useEffect, useState, useCallback } from "react";

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: unknown;
  };
}

export const STAFF_TOKEN_KEY = "xgoo_staff_token";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem(STAFF_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem(STAFF_TOKEN_KEY);
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback((token: string, authUser: AuthUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STAFF_TOKEN_KEY, token);
    }
    setUser(authUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STAFF_TOKEN_KEY);
    }
    setUser(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    isLoggingOut: false,
  };
}
