import { isMessengerSite } from "./editable";
import type { HighlightErrorItem } from "../core/error-state";

const ERROR_CLASS = "bolor-error";
const CORRECTED_CLASS = "bolor-corrected";
const MARK_ATTR = "data-bolor-highlight";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isInlineEditableElement = (el: HTMLElement | null) => {
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return false;
  }

  const contentEditableAttr = el.getAttribute("contenteditable");

  return (
    el.isContentEditable ||
    contentEditableAttr === "true" ||
    contentEditableAttr === "plaintext-only"
  );
};

const getHighlightTarget = (root: HTMLElement) => {
  if (root instanceof HTMLInputElement || root instanceof HTMLTextAreaElement) {
    return root;
  }

  if (isInlineEditableElement(root)) {
    return root;
  }

  const innerEditable = root.querySelector<HTMLElement>(
    [
      '[contenteditable="true"]',
      '[contenteditable="plaintext-only"]',
      "[contenteditable]",
      '[role="textbox"][contenteditable="true"]',
      '[role="textbox"][contenteditable="plaintext-only"]',
      '[role="textbox"][contenteditable]',
    ].join(","),
  );

  return innerEditable ?? root;
};

export const canInlineHighlight = (root: HTMLElement) => {
  const target = getHighlightTarget(root);

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return false;
  }

  if (!isInlineEditableElement(target)) return false;
  if (isMessengerSite()) return false;

  return true;
};

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

const isWordChar = (char: string) => {
  return /[\p{L}\p{N}_]/u.test(char);
};

const findWordRange = (text: string, word: string) => {
  const escaped = escapeRegExp(word.trim());
  if (!escaped) return null;

  const regex = new RegExp(escaped, "giu");
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const start = match.index;
    const end = start + matchedText.length;

    const prevChar = start > 0 ? text[start - 1] : "";
    const nextChar = end < text.length ? text[end] : "";

    const validLeft = !prevChar || !isWordChar(prevChar);
    const validRight = !nextChar || !isWordChar(nextChar);

    if (validLeft && validRight) {
      return { start, end };
    }
  }

  return null;
};

const wrapNextMatch = (
  root: HTMLElement,
  word: string,
  className: string,
  id: string,
) => {
  const target = getHighlightTarget(root);

  if (!canInlineHighlight(target)) return false;

  const trimmed = word.trim();
  if (!trimmed) return false;

  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentEl = node.parentElement;

      if (!parentEl) return NodeFilter.FILTER_REJECT;
      if (parentEl.closest(`[${MARK_ATTR}="true"]`)) {
        return NodeFilter.FILTER_REJECT;
      }

      const value = node.nodeValue || "";
      if (!value.trim()) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let textNode: Text | null = null;

  while ((textNode = walker.nextNode() as Text | null)) {
    const text = textNode.nodeValue || "";
    const rangeInfo = findWordRange(text, trimmed);

    if (!rangeInfo) continue;

    const range = document.createRange();
    range.setStart(textNode, rangeInfo.start);
    range.setEnd(textNode, rangeInfo.end);

    const span = document.createElement("span");
    span.className = className;
    span.setAttribute(MARK_ATTR, "true");
    span.dataset.bolorErrorId = id;

    try {
      range.surroundContents(span);
      return true;
    } catch {
      return false;
    }
  }

  return false;
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
