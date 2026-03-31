"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get(["themeMode"]);
        const savedThemeMode = result.themeMode as ThemeMode | undefined;

        if (
          savedThemeMode === "light" ||
          savedThemeMode === "dark" ||
          savedThemeMode === "system"
        ) {
          setThemeModeState(savedThemeMode);
        }
      } catch (error) {
        console.error("Failed to load theme settings:", error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const nextTheme = themeMode === "system" ? getSystemTheme() : themeMode;
      setResolvedTheme(nextTheme);

      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
    };

    applyTheme();

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (themeMode === "system") {
        applyTheme();
      }
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [themeMode]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);

    try {
      await chrome.storage.local.set({ themeMode: mode });
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
    }),
    [themeMode, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeSettings = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeSettings must be used inside ThemeProvider");
  }
  return context;
};
