import { activeElement } from "../core/state";
import { getDropdownElement } from "./dropdown-dom";

const GAP_Y = 12;

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

export const hasDropdownAnchor = () => {
  return Boolean(getAnchorRect());
};
