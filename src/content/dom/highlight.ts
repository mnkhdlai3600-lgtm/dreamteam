import { isMessengerSite } from "./editable";

const ERROR_CLASS = "bolor-error";
const CORRECTED_CLASS = "bolor-corrected";
const ERROR_LINE_CLASS = "bolor-error-line";
const CORRECTED_LINE_CLASS = "bolor-corrected-line";
const MARK_ATTR = "data-bolor-highlight";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getHighlightTarget = (root: HTMLElement) => {
  if (root instanceof HTMLInputElement || root instanceof HTMLTextAreaElement) {
    return root;
  }

  if (root.isContentEditable) {
    return root;
  }

  const innerEditable = root.querySelector<HTMLElement>(
    [
      "textarea",
      'input[type="text"]',
      'input[type="search"]',
      'input[type="email"]',
      'input[type="url"]',
      'input[type="tel"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ].join(","),
  );

  return innerEditable ?? root;
};

export const canInlineHighlight = (root: HTMLElement) => {
  const target = getHighlightTarget(root);
  if (!target.isContentEditable) return false;
  if (isMessengerSite()) return false;
  return true;
};

const clearLineState = (root: HTMLElement) => {
  const target = getHighlightTarget(root);
  target.classList.remove(ERROR_LINE_CLASS);
  target.classList.remove(CORRECTED_LINE_CLASS);
};

export const clearHighlights = (root: HTMLElement) => {
  const target = getHighlightTarget(root);
  clearLineState(target);

  const marks = target.querySelectorAll<HTMLElement>(`[${MARK_ATTR}="true"]`);

  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;

    parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
    parent.normalize();
  });
};

const wrapFirstMatch = (root: HTMLElement, word: string, className: string) => {
  const target = getHighlightTarget(root);

  if (!canInlineHighlight(target)) return false;

  const escaped = escapeRegExp(word.trim());
  if (!escaped) return false;

  const pattern = new RegExp(`(^|\\s)(${escaped})(?=\\s|$)`, "i");
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);

  let textNode: Text | null = null;

  while ((textNode = walker.nextNode() as Text | null)) {
    const text = textNode.nodeValue || "";
    const match = text.match(pattern);
    if (!match || match.index == null) continue;

    const fullMatch = match[0];
    const wordMatch = match[2];
    const offsetInsideMatch = fullMatch.lastIndexOf(wordMatch);
    const start = match.index + offsetInsideMatch;
    const end = start + wordMatch.length;

    const range = document.createRange();
    range.setStart(textNode, start);
    range.setEnd(textNode, end);

    const span = document.createElement("span");
    span.className = className;
    span.setAttribute(MARK_ATTR, "true");

    try {
      range.surroundContents(span);
      return true;
    } catch {
      return false;
    }
  }

  return false;
};

export const highlightErrorWord = (root: HTMLElement, word: string) => {
  const target = getHighlightTarget(root);

  clearHighlights(target);

  const inlineApplied = wrapFirstMatch(target, word, ERROR_CLASS);
  if (inlineApplied) return true;

  target.classList.add(ERROR_LINE_CLASS);
  return true;
};

export const flashCorrectedWord = (root: HTMLElement, word: string) => {
  const target = getHighlightTarget(root);

  clearHighlights(target);

  const inlineApplied = wrapFirstMatch(target, word, CORRECTED_CLASS);

  if (!inlineApplied) {
    target.classList.add(CORRECTED_LINE_CLASS);
  }

  window.setTimeout(() => {
    clearHighlights(target);
  }, 900);

  return true;
};
