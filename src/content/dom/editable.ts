import { activeElement } from "../core/state";

export const isMessengerSite = () => {
  const host = window.location.hostname;
  return host.includes("messenger.com") || host.includes("facebook.com");
};

export const isEditableElement = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return true;

  if (el instanceof HTMLInputElement) {
    return ["text", "search", "email", "url", "tel"].includes(el.type);
  }

  return el.isContentEditable || el.getAttribute("role") === "textbox";
};

export const getMessengerEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  const root = target.closest(
    [
      '[contenteditable="true"][role="textbox"]',
      '[role="textbox"][contenteditable="true"]',
      '[contenteditable="true"][data-lexical-editor="true"]',
      '[data-lexical-editor="true"][contenteditable="true"]',
      '[aria-label][contenteditable="true"][role="textbox"]',
    ].join(","),
  );

  return root instanceof HTMLElement ? root : null;
};

export const getEditableElement = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  if (isMessengerSite()) {
    const messengerEditor = getMessengerEditorRoot(target);
    if (messengerEditor) return messengerEditor;
  }

  if (isEditableElement(target)) return target;

  const closest = target.closest(
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

  return closest instanceof HTMLElement ? closest : null;
};

export const getEventEditableTarget = (event: Event) => {
  if (typeof event.composedPath === "function") {
    for (const item of event.composedPath()) {
      const editable = getEditableElement(item);
      if (editable) return editable;
    }
  }

  return getEditableElement(event.target);
};

export const normalizeText = (text: string) =>
  text
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();

export const getElementText = (el: HTMLElement) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
    return el.value;
  if (el.isContentEditable || el.getAttribute("role") === "textbox") {
    return normalizeText(el.innerText || el.textContent || "");
  }
  return "";
};

export const verifyElementText = (el: HTMLElement, expected: string) => {
  const current = normalizeText(getElementText(el)).replace(/\s+/g, " ");
  const wanted = normalizeText(expected).replace(/\s+/g, " ");
  return current === wanted;
};

export const resolveActiveEditable = () => {
  const current = document.activeElement;
  if (current) {
    const editable = getEditableElement(current);
    if (editable) return editable;
  }

  const selection = window.getSelection();
  if (selection?.anchorNode) {
    const node =
      selection.anchorNode instanceof Element
        ? selection.anchorNode
        : selection.anchorNode.parentElement;

    const editable = getEditableElement(node);
    if (editable) return editable;
  }

  return activeElement;
};
