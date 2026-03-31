import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getThemeMode,
  setThemeMode as saveThemeMode,
} from "../lib/chrome/storage";

export type ThemeMode = "light" | "dark" | "system";

type ResolvedTheme = "light" | "dark";

type ThemeContextType = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadTheme = async () => {
      try {
        const savedTheme = await getThemeMode();

        if (!isMounted) return;

        if (
          savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system"
        ) {
          setThemeModeState(savedTheme);
        } else {
          setThemeModeState("system");
        }
      } catch (error) {
        console.error("Failed to load theme mode:", error);
        if (isMounted) {
          setThemeModeState("system");
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    loadTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const nextTheme = themeMode === "system" ? getSystemTheme() : themeMode;

      setResolvedTheme(nextTheme);

      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      root.setAttribute("data-theme", nextTheme);
    };

    applyTheme();

    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (themeMode === "system") {
        applyTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [themeMode]);

  const handleSetThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);

    try {
      await saveThemeMode(mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode: handleSetThemeMode,
    }),
    [themeMode, resolvedTheme],
  );

  if (!isLoaded) {
    return null;
  }

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
