import {
  getResolvedTheme,
  getSurfaceStylesByTheme,
} from "../indicator/indicator-theme";

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

    @keyframes bolor-ai-dropdown-in {
      0% {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
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
  dropdown.setAttribute("role", "listbox");

  dropdown.style.position = "fixed";
  dropdown.style.left = "0";
  dropdown.style.top = "0";
  dropdown.style.width = "260px";
  dropdown.style.maxWidth = "260px";
  dropdown.style.maxHeight = "260px";
  dropdown.style.overflowY = "auto";
  dropdown.style.overflowX = "hidden";
  dropdown.style.padding = "8px";
  dropdown.style.borderRadius = "18px";
  dropdown.style.border = styles.panelBorder;
  dropdown.style.background = styles.panelBackground;
  dropdown.style.color = styles.panelText;
  dropdown.style.boxShadow = styles.shadowStrong;
  dropdown.style.backdropFilter = "blur(12px)";
  dropdown.style.zIndex = "2147483647";
  dropdown.style.pointerEvents = "auto";
  dropdown.style.userSelect = "none";
  dropdown.style.display = "block";
  dropdown.style.visibility = "visible";
  dropdown.style.opacity = "1";
  dropdown.style.boxSizing = "border-box";
  dropdown.style.fontFamily = "Inter, Arial, sans-serif";
  dropdown.style.transformOrigin = "top left";
  dropdown.style.animation =
    "bolor-ai-dropdown-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both";

  return dropdown;
};
