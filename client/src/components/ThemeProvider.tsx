import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STAFF_PATH_PREFIXES = [
  "/dashboard",
  "/bookings",
  "/shipments",
  "/documents",
  "/quotations",
  "/booking-requests",
  "/customers",
  "/partners",
  "/pricing",
  "/reports",
  "/settings",
];

function isStaffAppPath(path: string): boolean {
  return STAFF_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("xgoo-theme") as Theme;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const pathOnly = location.split("?")[0] || "/";
  const appliedTheme = isStaffAppPath(pathOnly) ? theme : "light";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(appliedTheme);
  }, [appliedTheme]);

  useEffect(() => {
    localStorage.setItem("xgoo-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
