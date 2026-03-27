const DEFAULT_ACCENT = "#8b5cf6";
const INDICATOR_ID = "bolor-ai-indicator";

export const isValidHexColor = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
  );
};

export const getAccentColor = async (): Promise<string> => {
  try {
    const result = await chrome.storage.local.get(["accentColor"]);
    const savedAccent = result.accentColor;
    return isValidHexColor(savedAccent) ? savedAccent : DEFAULT_ACCENT;
  } catch (error) {
    console.error("Failed to load accent color:", error);
    return DEFAULT_ACCENT;
  }
};

export const applyAccentColorToRoot = (color: string) => {
  document.documentElement.style.setProperty("--bolor-accent", color);
};

export const applyInitialAccentColor = async () => {
  const accentColor = await getAccentColor();
  applyAccentColorToRoot(accentColor);
};

export const watchAccentColorChanges = () => {
  if (!chrome?.storage?.onChanged) return;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.accentColor) return;

    const nextColor = isValidHexColor(changes.accentColor.newValue)
      ? changes.accentColor.newValue
      : DEFAULT_ACCENT;

    applyAccentColorToRoot(nextColor);

    const indicator = document.getElementById(
      INDICATOR_ID,
    ) as HTMLDivElement | null;
    if (indicator) indicator.style.background = nextColor;
  });
};
