import {
  activeElement,
  isSuggestionLoading,
  latestSuggestions,
  selectedSuggestionIndex,
  setIsSuggestionMenuOpen,
  setSelectedSuggestionIndex,
} from "../core/state";

const DROPDOWN_ID = "bolor-ai-suggestion-dropdown";
const GAP_Y = 12;

const ensureDropdownStyles = () => {
  if (document.getElementById("bolor-ai-dropdown-style")) return;

  const style = document.createElement("style");
  style.id = "bolor-ai-dropdown-style";
  style.textContent = `
    @keyframes bolor-ai-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

const getAnchorRect = () => {
  const indicator = document.getElementById("bolor-ai-indicator");
  if (indicator) {
    return indicator.getBoundingClientRect();
  }

  if (activeElement) {
    return activeElement.getBoundingClientRect();
  }

  return null;
};

const getDropdownElement = () => {
  return document.getElementById(DROPDOWN_ID) as HTMLDivElement | null;
};

export const refreshSuggestionDropdownHighlight = () => {
  const dropdown = getDropdownElement();
  if (!dropdown) return;

  const items = dropdown.querySelectorAll<HTMLElement>(
    "[data-suggestion-item]",
  );
  if (!items.length) return;

  items.forEach((item, index) => {
    const isActive = index === selectedSuggestionIndex;
    item.style.background = isActive ? "rgba(255,255,255,0.12)" : "transparent";
    item.style.borderColor = isActive
      ? "rgba(255,255,255,0.18)"
      : "transparent";

    if (isActive) {
      item.scrollIntoView({
        block: "nearest",
      });
    }
  });
};

export const removeSuggestionDropdown = () => {
  getDropdownElement()?.remove();
  setIsSuggestionMenuOpen(false);
};

export const repositionSuggestionDropdown = () => {
  const dropdown = getDropdownElement();
  const anchorRect = getAnchorRect();

  if (!dropdown || !anchorRect) return;

  const width = Math.min(Math.max(anchorRect.width, 260), 420);
  let left = anchorRect.left;
  let top = anchorRect.bottom + GAP_Y;

  if (left + width > window.innerWidth - 12) {
    left = window.innerWidth - width - 12;
  }

  if (left < 12) {
    left = 12;
  }

  if (top + dropdown.offsetHeight > window.innerHeight - 12) {
    top = anchorRect.top - dropdown.offsetHeight - GAP_Y;
  }

  if (top < 12) {
    top = 12;
  }

  dropdown.style.width = `${width}px`;
  dropdown.style.left = `${left}px`;
  dropdown.style.top = `${top}px`;
};

export const renderSuggestionDropdown = (onPick: (value: string) => void) => {
  ensureDropdownStyles();
  removeSuggestionDropdown();

  const anchorRect = getAnchorRect();
  if (!anchorRect) return;

  if (!isSuggestionLoading && !latestSuggestions.length) return;

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

  if (isSuggestionLoading) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "10px 12px";

    const spinner = document.createElement("div");
    spinner.style.width = "16px";
    spinner.style.height = "16px";
    spinner.style.borderRadius = "9999px";
    spinner.style.border = "2px solid rgba(255,255,255,0.22)";
    spinner.style.borderTopColor = "#ffffff";
    spinner.style.animation = "bolor-ai-spin 0.8s linear infinite";

    const label = document.createElement("div");
    label.textContent = "Шалгаж байна...";

    row.appendChild(spinner);
    row.appendChild(label);
    dropdown.appendChild(row);
  } else {
    latestSuggestions.forEach((suggestion, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.textContent = suggestion;
      item.dataset.suggestionItem = "true";

      item.style.width = "100%";
      item.style.display = "block";
      item.style.textAlign = "left";
      item.style.padding = "10px 12px";
      item.style.margin = "0";
      item.style.borderRadius = "10px";
      item.style.border = "1px solid transparent";
      item.style.background = "transparent";
      item.style.color = "#ffffff";
      item.style.cursor = "pointer";
      item.style.outline = "none";

      item.addEventListener("mouseenter", () => {
        setSelectedSuggestionIndex(index);
        refreshSuggestionDropdownHighlight();
      });

      item.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onPick(suggestion);
      });

      dropdown.appendChild(item);
    });

    const footer = document.createElement("div");
    footer.textContent = "↑ ↓ сонгох • Enter эсвэл click";
    footer.style.fontSize = "11px";
    footer.style.opacity = "0.65";
    footer.style.padding = "8px 12px 4px";
    dropdown.appendChild(footer);
  }

  document.body.appendChild(dropdown);
  setIsSuggestionMenuOpen(true);
  repositionSuggestionDropdown();
  refreshSuggestionDropdownHighlight();
};
