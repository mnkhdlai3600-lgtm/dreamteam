import type { HighlightErrorItem } from "../core/error-state";
import { canInlineHighlight, getHighlightTarget } from "./highlight-target";
import { wrapNextMatch } from "./highlight-wrap";

const ERROR_CLASS = "bolor-error";
const CORRECTED_CLASS = "bolor-corrected";
const MARK_ATTR = "data-bolor-highlight";

export const clearHighlights = (root: HTMLElement) => {
  const target = getHighlightTarget(root);

  const marks = target.querySelectorAll<HTMLElement>(`[${MARK_ATTR}="true"]`);

  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;

    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }

    parent.removeChild(mark);
    parent.normalize();
  });
};

export const highlightErrorWords = (
  root: HTMLElement,
  words: string[],
): HighlightErrorItem[] => {
  const target = getHighlightTarget(root);
  clearHighlights(target);

  if (!canInlineHighlight(target)) {
    return [];
  }

  const items: HighlightErrorItem[] = [];

  words.forEach((word, index) => {
    const trimmed = word.trim();
    if (!trimmed) return;

    const id = `err-${index}-${trimmed}`;
    const ok = wrapNextMatch(target, trimmed, ERROR_CLASS, id);

    if (ok) {
      items.push({ id, word: trimmed });
    }
  });

  return items;
};

export const highlightErrorWord = (root: HTMLElement, word: string) => {
  const items = highlightErrorWords(root, [word]);
  return items.length > 0;
};

export const getHighlightedErrorElementById = (
  root: HTMLElement,
  id: string,
) => {
  const target = getHighlightTarget(root);
  return target.querySelector<HTMLElement>(`[data-bolor-error-id="${id}"]`);
};

export const focusHighlightedErrorById = (root: HTMLElement, id: string) => {
  const target = getHighlightTarget(root);
  const errorEl = getHighlightedErrorElementById(target, id);

  if (!errorEl) return false;

  target.focus?.();
  errorEl.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: "smooth",
  });

  const selection = window.getSelection();
  if (!selection) return true;

  try {
    const range = document.createRange();

    range.setStartAfter(errorEl);
    range.setEndAfter(errorEl);

    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    return true;
  }

  return true;
};

export const flashCorrectedWord = (root: HTMLElement, word: string) => {
  const target = getHighlightTarget(root);
  clearHighlights(target);

  const ok = wrapNextMatch(target, word, CORRECTED_CLASS, `ok-${Date.now()}`);

  if (ok) {
    window.setTimeout(() => {
      clearHighlights(target);
    }, 900);
  }

  return ok;
};
