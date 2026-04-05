import { getCaretClientRect } from "../../dom/caret";

const isValidRect = (rect: DOMRect | null) => {
  return !!rect && Number.isFinite(rect.top) && Number.isFinite(rect.left);
};

const getSelectionAnchorRect = (target: HTMLElement): DOMRect | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const sourceRange = selection.getRangeAt(0);

  if (
    !target.contains(sourceRange.startContainer) &&
    !target.contains(sourceRange.endContainer) &&
    sourceRange.startContainer !== target &&
    sourceRange.endContainer !== target
  ) {
    return null;
  }

  const range = sourceRange.cloneRange();
  range.collapse(false);

  const rects = range.getClientRects();
  const rect = rects[rects.length - 1] ?? range.getBoundingClientRect();

  if (!rect || (!rect.width && !rect.height)) {
    return null;
  }

  return new DOMRect(rect.left, rect.top, Math.max(1, rect.width), rect.height);
};

const getFallbackAnchorRect = (target: HTMLElement): DOMRect => {
  const rect = target.getBoundingClientRect();

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return new DOMRect(
      rect.right - 2,
      rect.top + rect.height / 2 - 10,
      1,
      Math.max(20, rect.height * 0.6),
    );
  }

  return new DOMRect(
    rect.right - 2,
    rect.top + 6,
    1,
    Math.max(20, rect.height - 12),
  );
};

export const getTextEndAnchorRect = (target: HTMLElement): DOMRect => {
  const selectionRect = getSelectionAnchorRect(target);

  if (selectionRect && isValidRect(selectionRect)) {
    return selectionRect;
  }

  const caretRect = getCaretClientRect(target);

  if (
    caretRect &&
    isValidRect(caretRect) &&
    (caretRect.width > 0 || caretRect.height > 0)
  ) {
    return caretRect;
  }

  return getFallbackAnchorRect(target);
};
