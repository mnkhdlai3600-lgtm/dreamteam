type ResolvedTheme = "light" | "dark";

const THEME_MODE_KEY = "themeMode";

const getSystemResolvedTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getSavedThemeMode = async (): Promise<string> => {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) {
      resolve("system");
      return;
    }

    chrome.storage.sync.get([THEME_MODE_KEY], (result) => {
      const savedTheme = result[THEME_MODE_KEY];

      if (
        savedTheme === "light" ||
        savedTheme === "dark" ||
        savedTheme === "system"
      ) {
        resolve(savedTheme);
        return;
      }

      resolve("system");
    });
  });
};

export const getResolvedTheme = async (): Promise<ResolvedTheme> => {
  try {
    const savedTheme = await getSavedThemeMode();

    if (savedTheme === "dark") return "dark";
    if (savedTheme === "light") return "light";

    return getSystemResolvedTheme();
  } catch (error) {
    console.error("Failed to get theme mode:", error);
    return getSystemResolvedTheme();
  }
};

export const getDotStylesByTheme = (theme: ResolvedTheme) => {
  if (theme === "dark") {
    return {
      background: "#ffffff",
      border: "2px solid rgba(17, 24, 39, 0.18)",
      shadowIdle: "0 4px 12px rgba(255,255,255,0.18)",
      shadowLoading:
        "0 0 0 0 rgba(255,255,255,0.24), 0 4px 14px rgba(255,255,255,0.22)",
      idleOpacityMin: 0.55,
      idleOpacityMax: 1,
    };
  }

  return {
    background: "#4b5563",
    border: "2px solid rgba(255,255,255,0.92)",
    shadowIdle: "0 4px 12px rgba(0,0,0,0.18)",
    shadowLoading: "0 0 0 0 rgba(75,85,99,0.22), 0 4px 14px rgba(0,0,0,0.20)",
    idleOpacityMin: 0.45,
    idleOpacityMax: 0.82,
  };
};
