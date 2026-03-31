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

export const createDropdownElement = () => {
  const dropdown = document.createElement("div");
  dropdown.id = DROPDOWN_ID;
  dropdown.style.position = "fixed";
  dropdown.style.zIndex = "999999";
  dropdown.style.borderRadius = "14px";
  dropdown.style.padding = "8px";
  dropdown.style.background = "rgba(28, 28, 32, 0.96)";
  dropdown.style.backdropFilter = "blur(10px)";
  dropdown.style.boxShadow = "0 12px 32px rgba(0,0,0,0.28)";
  dropdown.style.border = "1px solid rgba(255,255,255,0.08)";
  dropdown.style.color = "#ffffff";
  dropdown.style.fontSize = "13px";
  dropdown.style.fontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  dropdown.style.maxHeight = "260px";
  dropdown.style.overflowY = "auto";

  return dropdown;
};
