"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // On mount, apply saved theme to document.documentElement
  useEffect(() => {
    try {
      const saved = localStorage.getItem("paypulse-theme") as Theme | null;
      const effectiveTheme: Theme = saved || "light"; // default to light theme as primary
      const actualTheme =
        effectiveTheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : effectiveTheme;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(effectiveTheme);
      setResolvedTheme(actualTheme);

      if (actualTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    let actualTheme: "light" | "dark" = "light";
    if (newTheme === "system") {
      actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      actualTheme = newTheme;
    }

    setResolvedTheme(actualTheme);
    if (actualTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      localStorage.setItem("paypulse-theme", newTheme);
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
