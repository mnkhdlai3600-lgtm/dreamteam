import { getSelectionClientRect, getTextEndClientRect } from "../../dom/caret";
import {
  getGoogleDocsCanvas,
  getGoogleDocsPage,
  isGoogleDocsSite,
} from "../../dom/google-docs";

const isValidRect = (rect: DOMRect | null) => {
  return !!rect && Number.isFinite(rect.top) && Number.isFinite(rect.left);
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

const getDocsCanvasAnchorRect = (target: HTMLElement): DOMRect | null => {
  const canvas = getGoogleDocsCanvas(target);
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    if (isValidRect(rect) && rect.width > 0 && rect.height > 0) {
      return new DOMRect(
        rect.left + 8,
        rect.top + 8,
        1,
        Math.max(20, Math.min(28, rect.height - 16)),
      );
    }
  }

  const page = getGoogleDocsPage(target);
  if (page) {
    const rect = page.getBoundingClientRect();
    if (isValidRect(rect) && rect.width > 0 && rect.height > 0) {
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

export const getTextEndAnchorRect = (target: HTMLElement): DOMRect => {
  if (isGoogleDocsSite()) {
    const selectionRect = getSelectionClientRect(target);

    if (
      selectionRect &&
      isValidRect(selectionRect) &&
      (selectionRect.width > 0 || selectionRect.height > 0)
    ) {
      return selectionRect;
    }

    const docsRect = getDocsCanvasAnchorRect(target);
    if (docsRect) return docsRect;

    return getFallbackAnchorRect(target);
  }

  const text =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target.value.trim()
      : (target.textContent ?? "").trim();

  if (!text) {
    const selectionRect = getSelectionClientRect(target);

    if (
      selectionRect &&
      isValidRect(selectionRect) &&
      (selectionRect.width > 0 || selectionRect.height > 0)
    ) {
      return selectionRect;
    }

    return getFallbackAnchorRect(target);
  }

  const textEndRect = getTextEndClientRect(target);

  if (
    textEndRect &&
    isValidRect(textEndRect) &&
    (textEndRect.width > 0 || textEndRect.height > 0)
  ) {
    return textEndRect;
  }

  const selectionRect = getSelectionClientRect(target);

  if (
    selectionRect &&
    isValidRect(selectionRect) &&
    (selectionRect.width > 0 || selectionRect.height > 0)
  ) {
    return selectionRect;
  }

  return getFallbackAnchorRect(target);
};
