import {
  isSuggestionLoading,
  latestSuggestions,
  selectedSuggestionIndex,
  setIsSuggestionMenuOpen,
  setSelectedSuggestionIndex,
} from "../core/state";
import {
  createDropdownElement,
  ensureDropdownStyles,
  getDropdownElement,
} from "./dropdown-dom";
import {
  hasDropdownAnchor,
  repositionSuggestionDropdown,
} from "./dropdown-position";

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
      item.scrollIntoView({ block: "nearest" });
    }
  });
};

export const removeSuggestionDropdown = () => {
  getDropdownElement()?.remove();
  setIsSuggestionMenuOpen(false);
};

const createLoadingRow = () => {
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

  return row;
};

const createSuggestionItem = (
  suggestion: string,
  index: number,
  onPick: (value: string) => void,
) => {
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

  return item;
};

const createFooter = () => {
  const footer = document.createElement("div");
  footer.textContent = "↑ ↓ сонгох • Enter эсвэл click";
  footer.style.fontSize = "11px";
  footer.style.opacity = "0.65";
  footer.style.padding = "8px 12px 4px";

  return footer;
};

export const renderSuggestionDropdown = (onPick: (value: string) => void) => {
  ensureDropdownStyles();
  removeSuggestionDropdown();

  if (!hasDropdownAnchor()) return;
  if (!isSuggestionLoading && !latestSuggestions.length) return;

  const dropdown = createDropdownElement();

  if (isSuggestionLoading) {
    dropdown.appendChild(createLoadingRow());
  } else {
    latestSuggestions.forEach((suggestion, index) => {
      dropdown.appendChild(createSuggestionItem(suggestion, index, onPick));
    });

    dropdown.appendChild(createFooter());
  }

  document.body.appendChild(dropdown);
  setIsSuggestionMenuOpen(true);
  repositionSuggestionDropdown();
  refreshSuggestionDropdownHighlight();
};
