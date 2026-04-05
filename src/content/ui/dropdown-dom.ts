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

    #${DROPDOWN_ID}::-webkit-scrollbar {
      width: 8px;
    }

    #${DROPDOWN_ID}::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: rgba(127, 127, 127, 0.35);
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
  dropdown.style.borderRadius = "12px";
  dropdown.style.padding = "6px";
  dropdown.style.background = styles.panelBackground;
  dropdown.style.backdropFilter = "blur(10px)";
  dropdown.style.boxShadow = styles.shadow;
  dropdown.style.border = styles.panelBorder;
  dropdown.style.color = styles.panelText;
  dropdown.style.fontSize = "12px";
  dropdown.style.fontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

  dropdown.style.width = "240px";
  dropdown.style.minWidth = "240px";
  dropdown.style.maxWidth = "240px";
  dropdown.style.maxHeight = "220px";
  dropdown.style.overflowX = "hidden";
  dropdown.style.overflowY = "auto";

  return dropdown;
};
