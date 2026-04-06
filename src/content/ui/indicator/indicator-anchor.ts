import { getSelectionClientRect, getTextEndClientRect } from "../../dom/caret";

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

export const getTextEndAnchorRect = (target: HTMLElement): DOMRect => {
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
