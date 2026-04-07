import { activeElement } from "../core/state";
import { getCaretClientRect } from "../dom/caret";
import {
  getGoogleDocsCursorRect,
  getGoogleDocsPage,
  isGoogleDocsSite,
} from "../dom/google-docs";
import { getDropdownElement } from "./dropdown-dom";

const GAP_Y = 10;
const GAP_X = 6;
const VIEWPORT_GAP = 12;
const MIN_WIDTH = 220;
const MAX_WIDTH = 280;

let lastDocsAnchorRect: DOMRect | null = null;

const isValidRect = (rect: DOMRect | null): rect is DOMRect => {
  return (
    !!rect &&
    Number.isFinite(rect.left) &&
    Number.isFinite(rect.top) &&
    (rect.width > 0 || rect.height > 0)
  );
};

const isVisibleViewportRect = (rect: DOMRect | null): rect is DOMRect => {
  if (!isValidRect(rect)) return false;

  const minX = -20;
  const minY = -20;
  const maxX = window.innerWidth + 20;
  const maxY = window.innerHeight + 20;

  return (
    rect.left >= minX &&
    rect.top >= minY &&
    rect.left <= maxX &&
    rect.top <= maxY
  );
};

const getDocsAnchorRect = (): DOMRect | null => {
  const cursorRect = getGoogleDocsCursorRect();

  if (isVisibleViewportRect(cursorRect)) {
    lastDocsAnchorRect = cursorRect;
    return cursorRect;
  }

  const page = getGoogleDocsPage();
  if (page) {
    const pageRect = page.getBoundingClientRect();

    if (isVisibleViewportRect(pageRect)) {
      const fallback = new DOMRect(
        pageRect.left + 40,
        pageRect.top + 40,
        1,
        20,
      );

      if (isVisibleViewportRect(fallback)) {
        lastDocsAnchorRect = fallback;
        return fallback;
      }
    }
  }

  if (isVisibleViewportRect(lastDocsAnchorRect)) {
    return lastDocsAnchorRect;
  }

  return null;
};

const getDefaultAnchorRect = (): DOMRect | null => {
  if (activeElement) {
    const caretRect = getCaretClientRect(activeElement);
    if (isVisibleViewportRect(caretRect)) {
      return caretRect;
    }
  }

  if (activeElement) {
    const rect = activeElement.getBoundingClientRect();
    if (isVisibleViewportRect(rect)) {
      return new DOMRect(
        rect.left + 8,
        rect.top + 8,
        1,
        Math.max(20, Math.min(28, rect.height - 16)),
      );
    }
  }

  return null;
};

const getAnchorRect = (): DOMRect | null => {
  if (isGoogleDocsSite()) {
    const docsRect = getDocsAnchorRect();
    if (docsRect) return docsRect;
  }

  return getDefaultAnchorRect();
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

  const preferRight =
    !isGoogleDocsSite() ||
    anchorRect.right + width + VIEWPORT_GAP <= viewportWidth;

  const preferredLeft = preferRight
    ? anchorRect.right + GAP_X
    : anchorRect.left;

  const maxLeft = viewportWidth - width - VIEWPORT_GAP;
  let left = clamp(preferredLeft, VIEWPORT_GAP, maxLeft);

  if (preferRight && left + width > viewportWidth - VIEWPORT_GAP) {
    left = clamp(anchorRect.left - width - GAP_X, VIEWPORT_GAP, maxLeft);
  }

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
