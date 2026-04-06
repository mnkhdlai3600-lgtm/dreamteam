import { activeElement } from "../core/state";
import {
  getGoogleDocsEditorRoot,
  getGoogleDocsText,
  isGoogleDocsSite,
  resolveGoogleDocsActiveEditable,
} from "./google-docs";

export const isMessengerSite = () => {
  const host = window.location.hostname;
  return host.includes("messenger.com") || host.includes("facebook.com");
};

export const isGmailSite = () =>
  window.location.hostname.includes("mail.google.com");

const isTextInputType = (type: string) =>
  ["text", "search", "email", "url", "tel"].includes(type);

const isContentEditableLike = (el: HTMLElement) => {
  const value = el.getAttribute("contenteditable");
  return el.isContentEditable || value === "true" || value === "plaintext-only";
};

export const isEditableElement = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return isTextInputType(el.type);

  return isContentEditableLike(el) || el.getAttribute("role") === "textbox";
};

const getSelectionElement = () => {
  const selection = window.getSelection();
  if (!selection) return null;

  const node =
    selection.anchorNode instanceof Element
      ? selection.anchorNode
      : (selection.anchorNode?.parentElement ?? null);

  return node instanceof HTMLElement ? node : null;
};

export const getMessengerEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  const root = target.closest(
    [
      '[contenteditable="true"][role="textbox"]',
      '[contenteditable="plaintext-only"][role="textbox"]',
      '[contenteditable][role="textbox"]',
      '[contenteditable="true"][data-lexical-editor="true"]',
      '[contenteditable="plaintext-only"][data-lexical-editor="true"]',
      '[aria-label][contenteditable="true"][role="textbox"]',
      '[aria-label][contenteditable="plaintext-only"][role="textbox"]',
    ].join(","),
  );

  return root instanceof HTMLElement ? root : null;
};

export const getGmailEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  const root = target.closest(
    [
      'div[role="textbox"][g_editable="true"][contenteditable="true"]',
      'div[role="textbox"][g_editable="true"]',
      'div[aria-label="Message Body"][role="textbox"][contenteditable="true"]',
    ].join(","),
  );

  return root instanceof HTMLElement ? root : null;
};

export const getEditableElement = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  if (isMessengerSite()) {
    const root = getMessengerEditorRoot(target);
    if (root) return root;
  }

  if (isGmailSite()) {
    const root = getGmailEditorRoot(target);
    if (root) return root;
  }

  if (isGoogleDocsSite()) {
    const root = getGoogleDocsEditorRoot(target);
    if (root) return root;
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
      '[contenteditable="plaintext-only"]',
      "[contenteditable]",
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

  if (isGmailSite()) {
    const fromSelection = getEditableElement(getSelectionElement());
    if (fromSelection) return fromSelection;
  }

  if (isGoogleDocsSite()) {
    const docsEditable = resolveGoogleDocsActiveEditable();
    if (docsEditable) return docsEditable;
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
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }

  if (isGoogleDocsSite()) {
    const docsText = getGoogleDocsText();
    if (docsText) return normalizeText(docsText);
  }

  if (isContentEditableLike(el) || el.getAttribute("role") === "textbox") {
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
  if (isGmailSite()) {
    const fromSelection = getEditableElement(getSelectionElement());
    if (fromSelection) return fromSelection;
  }

  if (isGoogleDocsSite()) {
    const docsEditable = resolveGoogleDocsActiveEditable();
    if (docsEditable) return docsEditable;
  }

  const current = document.activeElement;
  const fromActive = current ? getEditableElement(current) : null;
  if (fromActive) return fromActive;

  const fromSelection = getEditableElement(getSelectionElement());
  if (fromSelection) return fromSelection;

  return activeElement;
};
