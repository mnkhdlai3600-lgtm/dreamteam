type ResolvedTheme = "light" | "dark";

const THEME_MODE_KEY = "themeMode";

const getSystemResolvedTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getSavedThemeMode = async (): Promise<"light" | "dark" | "system"> => {
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
      border: "2px solid rgba(15, 23, 42, 0.18)",
      shadowIdle: "0 10px 18px rgba(255,255,255,0.14)",
      shadowLoading:
        "0 0 0 0 rgba(255,255,255,0.20), 0 10px 24px rgba(255,255,255,0.18)",
      idleOpacityMin: 0.56,
      idleOpacityMax: 0.98,
    };
  }

  return {
    background: "#4b5563",
    border: "2px solid rgba(255,255,255,0.96)",
    shadowIdle: "0 10px 18px rgba(15,23,42,0.16)",
    shadowLoading:
      "0 0 0 0 rgba(75,85,99,0.18), 0 10px 24px rgba(15,23,42,0.18)",
    idleOpacityMin: 0.46,
    idleOpacityMax: 0.84,
  };
};

export const getSurfaceStylesByTheme = (theme: ResolvedTheme) => {
  if (theme === "dark") {
    return {
      panelBackground: "rgba(22, 24, 29, 0.94)",
      panelText: "#f8fafc",
      panelBorder: "1px solid rgba(255,255,255,0.08)",
      itemHover: "rgba(255,255,255,0.08)",
      itemSelected: "rgba(255,255,255,0.13)",
      subtleText: "rgba(241,245,249,0.68)",
      itemBorderActive: "rgba(255,255,255,0.18)",
      spinnerTrack: "rgba(255,255,255,0.22)",
      spinnerHead: "#ffffff",
      shadow: "0 16px 40px rgba(0,0,0,0.30)",
      shadowStrong: "0 22px 54px rgba(0,0,0,0.36)",
      buttonBackground: "rgba(255,255,255,0.12)",
      buttonHover: "rgba(255,255,255,0.18)",
      buttonText: "#ffffff",
      focusRing: "0 0 0 4px rgba(255,255,255,0.06)",
    };
  }

  return {
    panelBackground: "rgba(255, 255, 255, 0.94)",
    panelText: "#0f172a",
    panelBorder: "1px solid rgba(15,23,42,0.08)",
    itemHover: "rgba(15,23,42,0.05)",
    itemSelected: "rgba(15,23,42,0.08)",
    subtleText: "rgba(15,23,42,0.58)",
    itemBorderActive: "rgba(15,23,42,0.12)",
    spinnerTrack: "rgba(15,23,42,0.14)",
    spinnerHead: "#334155",
    shadow: "0 16px 40px rgba(15,23,42,0.12)",
    shadowStrong: "0 22px 54px rgba(15,23,42,0.16)",
    buttonBackground: "rgba(15,23,42,0.08)",
    buttonHover: "rgba(15,23,42,0.12)",
    buttonText: "#0f172a",
    focusRing: "0 0 0 4px rgba(15,23,42,0.05)",
  };
};
