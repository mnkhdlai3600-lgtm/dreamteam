import { selectedSuggestionIndex } from "../core/state";

export const refreshSuggestionDropdownHighlight = () => {
  const indicator = document.getElementById("bolor-ai-indicator");
  if (!indicator) return;

  const items = indicator.querySelectorAll<HTMLElement>(
    "[data-suggestion-item]",
  );
  if (!items.length) return;

  items.forEach((item, index) => {
    item.style.background =
      index === selectedSuggestionIndex ? "rgba(0,0,0,0.08)" : "transparent";

    if (index === selectedSuggestionIndex) {
      item.scrollIntoView({
        block: "nearest",
      });
    }
  });
};

export const removeSuggestionDropdown = () => {};
export const renderSuggestionDropdown = (
  _onPick: (value: string) => void,
) => {};
export const repositionSuggestionDropdown = () => {};
