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
  accentColor: string;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const DEFAULT_ACCENT = "#8b5cf6";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [accentColor, setAccentColorState] = useState<string>(DEFAULT_ACCENT);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get([
          "themeMode",
          "accentColor",
        ]);

        const savedThemeMode = result.themeMode as ThemeMode | undefined;
        const savedAccent = result.accentColor as string | undefined;

        if (
          savedThemeMode === "light" ||
          savedThemeMode === "dark" ||
          savedThemeMode === "system"
        ) {
          setThemeModeState(savedThemeMode);
        }

        if (savedAccent) {
          setAccentColorState(savedAccent);
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
      root.style.setProperty("--accent-color", accentColor);
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
  }, [themeMode, accentColor]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);

    try {
      await chrome.storage.local.set({ themeMode: mode });
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    document.documentElement.style.setProperty("--accent-color", color);

    try {
      await chrome.storage.local.set({ accentColor: color });
    } catch (error) {
      console.error("Failed to save accent color:", error);
    }
  };

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      accentColor,
      setThemeMode,
      setAccentColor,
    }),
    [themeMode, resolvedTheme, accentColor],
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
