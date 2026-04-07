import { getCaretClientRect, getSelectionClientRect } from "../../dom/caret";
import {
  getGoogleDocsCursorRect,
  getGoogleDocsPage,
  isGoogleDocsSite,
} from "../../dom/google-docs";

let lastDocsAnchorRect: DOMRect | null = null;

const isValidRect = (rect: DOMRect | null): rect is DOMRect => {
  return (
    !!rect &&
    Number.isFinite(rect.top) &&
    Number.isFinite(rect.left) &&
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

const cloneRect = (rect: DOMRect) =>
  new DOMRect(rect.left, rect.top, rect.width, rect.height);

const rememberDocsRect = (rect: DOMRect | null) => {
  if (!isVisibleViewportRect(rect)) return null;
  lastDocsAnchorRect = cloneRect(rect);
  return rect;
};

const getFallbackAnchorRect = (target: HTMLElement): DOMRect => {
  const rect = target.getBoundingClientRect();

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return new DOMRect(
      rect.left + 4,
      rect.top + rect.height / 2 - 10,
      1,
      Math.max(20, rect.height * 0.6),
    );
  }

  return new DOMRect(
    rect.left + 4,
    rect.top + 6,
    1,
    Math.max(20, rect.height - 12),
  );
};

const getDocsPageAnchorRect = (target: HTMLElement): DOMRect | null => {
  const page = getGoogleDocsPage(target);
  if (!page) return null;

  const rect = page.getBoundingClientRect();
  if (!isValidRect(rect)) return null;

  return new DOMRect(rect.left + 80, rect.top + 80, 1, 20);
};

export const getTextEndAnchorRect = (target: HTMLElement): DOMRect => {
  if (isGoogleDocsSite()) {
    const cursorRect = getGoogleDocsCursorRect();
    if (isVisibleViewportRect(cursorRect)) {
      return rememberDocsRect(cursorRect) ?? cursorRect;
    }

    const selectionRect = getSelectionClientRect(target);
    if (isVisibleViewportRect(selectionRect)) {
      return rememberDocsRect(selectionRect) ?? selectionRect;
    }

    if (isVisibleViewportRect(lastDocsAnchorRect)) {
      return cloneRect(lastDocsAnchorRect);
    }

    const pageRect = getDocsPageAnchorRect(target);
    if (isVisibleViewportRect(pageRect)) {
      return pageRect;
    }

    return getFallbackAnchorRect(target);
  }

  const caretRect = getCaretClientRect(target);
  if (isVisibleViewportRect(caretRect)) {
    return caretRect;
  }

  const selectionRect = getSelectionClientRect(target);
  if (isVisibleViewportRect(selectionRect)) {
    return selectionRect;
  }

  return getFallbackAnchorRect(target);
};
