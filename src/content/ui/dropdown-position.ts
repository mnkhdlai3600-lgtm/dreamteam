import { activeElement } from "../core/state";
import { getCaretClientRect } from "../dom/caret";
import { getDropdownElement } from "./dropdown-dom";

const GAP_Y = 10;
const GAP_X = 6;
const VIEWPORT_GAP = 12;
const MIN_WIDTH = 220;
const MAX_WIDTH = 280;

const getAnchorRect = (): DOMRect | null => {
  if (activeElement) {
    const caretRect = getCaretClientRect(activeElement);
    if (caretRect && (caretRect.width || caretRect.height)) {
      return caretRect;
    }
  }

  const indicator = document.getElementById("bolor-ai-indicator");
  if (indicator) {
    const rect = indicator.getBoundingClientRect();
    if (rect.width || rect.height) return rect;
  }

  if (activeElement) {
    const rect = activeElement.getBoundingClientRect();
    if (rect.width || rect.height) return rect;
  }

  return null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const repositionSuggestionDropdown = () => {
  const dropdown = getDropdownElement();
  const anchorRect = getAnchorRect();

  if (!dropdown || !anchorRect) return;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const availableWidth = viewportWidth - VIEWPORT_GAP * 2;
  const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, availableWidth));

  dropdown.style.width = `${width}px`;
  dropdown.style.minWidth = `${width}px`;
  dropdown.style.maxWidth = `${width}px`;

  const dropdownHeight = dropdown.offsetHeight || 120;

  const preferredLeft = anchorRect.left + GAP_X;
  const maxLeft = viewportWidth - width - VIEWPORT_GAP;
  const left = clamp(preferredLeft, VIEWPORT_GAP, maxLeft);

  const spaceBelow = viewportHeight - anchorRect.bottom - VIEWPORT_GAP;
  const spaceAbove = anchorRect.top - VIEWPORT_GAP;

  let top = anchorRect.bottom + GAP_Y;

  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    top = anchorRect.top - dropdownHeight - GAP_Y;
  }

  const maxTop = viewportHeight - dropdownHeight - VIEWPORT_GAP;
  top = clamp(top, VIEWPORT_GAP, Math.max(VIEWPORT_GAP, maxTop));

  dropdown.style.left = `${left}px`;
  dropdown.style.top = `${top}px`;
};

export const hasDropdownAnchor = () => {
  return Boolean(getAnchorRect());
};
