import { isMessengerSite } from "./editable";

export const isInlineEditableElement = (el: HTMLElement | null) => {
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

export const getHighlightTarget = (root: HTMLElement) => {
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
