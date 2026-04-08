import {
  getResolvedTheme,
  getSurfaceStylesByTheme,
} from "./indicator/indicator-theme";

const DROPDOWN_ID = "bolor-ai-suggestion-dropdown";
const STYLE_ID = "bolor-ai-dropdown-style";

export const getDropdownElement = () =>
  document.getElementById(DROPDOWN_ID) as HTMLDivElement | null;

export const getAllDropdownElements = () =>
  Array.from(document.querySelectorAll<HTMLDivElement>(`#${DROPDOWN_ID}`));

export const ensureDropdownStyles = () => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes bolor-ai-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

export const createDropdownElement = async () => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const existing = getDropdownElement();
  if (existing) existing.remove();

  const dropdown = document.createElement("div");
  dropdown.id = DROPDOWN_ID;
  dropdown.dataset.theme = theme;

  dropdown.style.position = "fixed";
  dropdown.style.left = "0";
  dropdown.style.top = "0";
  dropdown.style.width = "190px";
  dropdown.style.maxWidth = "190px";
  dropdown.style.maxHeight = "180px";
  dropdown.style.overflowY = "auto";
  dropdown.style.overflowX = "hidden";
  dropdown.style.padding = "4px";
  dropdown.style.borderRadius = "12px";
  dropdown.style.border = `1px solid ${styles.panelBorder}`;
  dropdown.style.background = styles.panelBackground;
  dropdown.style.color = styles.panelText;
  dropdown.style.boxShadow = "0 10px 26px rgba(0, 0, 0, 0.18)";
  dropdown.style.backdropFilter = "blur(6px)";
  dropdown.style.zIndex = "2147483647";
  dropdown.style.pointerEvents = "auto";
  dropdown.style.userSelect = "none";
  dropdown.style.display = "block";
  dropdown.style.visibility = "visible";
  dropdown.style.opacity = "1";
  dropdown.style.boxSizing = "border-box";

  return dropdown;
};
