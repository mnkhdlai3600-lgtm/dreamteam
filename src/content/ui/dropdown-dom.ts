import {
  getResolvedTheme,
  getSurfaceStylesByTheme,
} from "./indicator/indicator-theme";

const DROPDOWN_ID = "bolor-ai-suggestion-dropdown";
const DROPDOWN_STYLE_ID = "bolor-ai-dropdown-style";

export const ensureDropdownStyles = () => {
  if (document.getElementById(DROPDOWN_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = DROPDOWN_STYLE_ID;
  style.textContent = `
    @keyframes bolor-ai-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
};

export const getDropdownElement = () => {
  return document.getElementById(DROPDOWN_ID) as HTMLDivElement | null;
};

export const getAllDropdownElements = () => {
  return Array.from(
    document.querySelectorAll<HTMLDivElement>(`#${DROPDOWN_ID}`),
  );
};

export const createDropdownElement = async () => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const dropdown = document.createElement("div");
  dropdown.id = DROPDOWN_ID;
  dropdown.dataset.theme = theme;
  dropdown.style.position = "fixed";
  dropdown.style.zIndex = "999999";
  dropdown.style.borderRadius = "14px";
  dropdown.style.padding = "8px";
  dropdown.style.background = styles.panelBackground;
  dropdown.style.backdropFilter = "blur(10px)";
  dropdown.style.boxShadow = styles.shadow;
  dropdown.style.border = styles.panelBorder;
  dropdown.style.color = styles.panelText;
  dropdown.style.fontSize = "13px";
  dropdown.style.fontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  dropdown.style.maxHeight = "260px";
  dropdown.style.overflowY = "auto";

  return dropdown;
};
