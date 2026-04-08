import { activeElement } from "../core/state";
import {
  getGoogleDocsEventTarget,
  getGoogleDocsIframeBody,
  getGoogleDocsIframeDocument,
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

const DOCS_EVENT_TARGET_SELECTORS = [
  ".docs-texteventtarget-div",
  '[contenteditable="true"][role="textbox"]',
  '[aria-label="Document"][role="textbox"]',
  '[aria-label="Документ"][role="textbox"]',
].join(",");

const isNodeElement = (value: unknown): value is Element => {
  return !!value && typeof value === "object" && (value as Node).nodeType === 1;
};

const isHtmlElementLike = (value: unknown): value is HTMLElement => {
  return (
    isNodeElement(value) &&
    typeof (value as HTMLElement).matches === "function" &&
    typeof (value as HTMLElement).closest === "function"
  );
};

const asHtmlElement = (value: unknown): HTMLElement | null => {
  return isHtmlElementLike(value) ? (value as HTMLElement) : null;
};

const isTextInputType = (type: string) =>
  ["text", "search", "email", "url", "tel"].includes(type);

const isContentEditableLike = (el: HTMLElement) => {
  const value = el.getAttribute("contenteditable");
  return el.isContentEditable || value === "true" || value === "plaintext-only";
};

export const isEditableElement = (el: Element | null): boolean => {
  const htmlEl = asHtmlElement(el);
  if (!htmlEl) return false;

  if (htmlEl instanceof HTMLTextAreaElement) return true;
  if (htmlEl instanceof HTMLInputElement) return isTextInputType(htmlEl.type);

  return (
    isContentEditableLike(htmlEl) || htmlEl.getAttribute("role") === "textbox"
  );
};

const getSelectionElement = () => {
  const selection = window.getSelection();
  if (!selection) return null;

  const anchor = selection.anchorNode;
  if (isNodeElement(anchor)) return anchor as HTMLElement;

  return asHtmlElement(anchor?.parentElement ?? null);
};

const isInsideDocsIframe = (target: EventTarget | null) => {
  const el = asHtmlElement(target);
  if (!el) return false;

  const iframeDoc = getGoogleDocsIframeDocument();
  if (!iframeDoc) return false;

  return el.ownerDocument === iframeDoc;
};

export const getMessengerEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  const el = asHtmlElement(target);
  if (!el) return null;

  return asHtmlElement(
    el.closest(
      [
        '[contenteditable="true"][role="textbox"]',
        '[contenteditable="plaintext-only"][role="textbox"]',
        '[contenteditable][role="textbox"]',
        '[contenteditable="true"][data-lexical-editor="true"]',
        '[contenteditable="plaintext-only"][data-lexical-editor="true"]',
        '[aria-label][contenteditable="true"][role="textbox"]',
        '[aria-label][contenteditable="plaintext-only"][role="textbox"]',
      ].join(","),
    ),
  );
};

export const getGmailEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  const el = asHtmlElement(target);
  if (!el) return null;

  return asHtmlElement(
    el.closest(
      [
        'div[role="textbox"][g_editable="true"][contenteditable="true"]',
        'div[role="textbox"][g_editable="true"]',
        'div[aria-label="Message Body"][role="textbox"][contenteditable="true"]',
      ].join(","),
    ),
  );
};

const getDocsEditableFromTarget = (target: EventTarget | null) => {
  const activeDocsTarget = resolveGoogleDocsActiveEditable();
  if (activeDocsTarget) return activeDocsTarget;

  const directDocsTarget = getGoogleDocsEventTarget();
  if (directDocsTarget) return directDocsTarget;

  const el = asHtmlElement(target);
  if (el) {
    const localEventTarget = asHtmlElement(
      el.closest(DOCS_EVENT_TARGET_SELECTORS),
    );
    if (localEventTarget) {
      return localEventTarget;
    }
  }

  if (isInsideDocsIframe(target)) {
    return getGoogleDocsIframeBody();
  }

  return null;
};

export const getEditableElement = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (isGoogleDocsSite()) {
    const docsEditable = getDocsEditableFromTarget(target);
    if (docsEditable) return docsEditable;
  }

  const el = asHtmlElement(target);
  if (!el) return null;

  if (isMessengerSite()) {
    const root = getMessengerEditorRoot(el);
    if (root) return root;
  }

  if (isGmailSite()) {
    const root = getGmailEditorRoot(el);
    if (root) return root;
  }

  if (isEditableElement(el)) return el;

  return asHtmlElement(
    el.closest(
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
    ),
  );
};

export const getEventEditableTarget = (event: Event) => {
  if (isGoogleDocsSite()) {
    const directDocsEditable = getDocsEditableFromTarget(event.target);
    if (directDocsEditable) return directDocsEditable;

    if (typeof event.composedPath === "function") {
      for (const item of event.composedPath()) {
        const docsEditable = getDocsEditableFromTarget(item);
        if (docsEditable) return docsEditable;
      }
    }

    return getGoogleDocsIframeBody() ?? resolveGoogleDocsActiveEditable();
  }

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

export const normalizeLiveText = (text: string) =>
  text
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n");

const normalizeComparableText = (text: string) =>
  normalizeText(text).replace(/\s+/g, " ");

export const getElementText = (el: HTMLElement) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }

  if (isGoogleDocsSite()) {
    const docsText = getGoogleDocsText();
    if (docsText) return normalizeLiveText(docsText);
  }

  if (isContentEditableLike(el) || el.getAttribute("role") === "textbox") {
    return normalizeText(el.innerText || el.textContent || "");
  }

  return "";
};

export const verifyElementText = (el: HTMLElement, expected: string) => {
  const current = normalizeComparableText(getElementText(el));
  const wanted = normalizeComparableText(expected);

  if (isGoogleDocsSite()) {
    if (!wanted) return true;
    if (current === wanted) return true;

    const currentNoSpaces = current.replace(/\s+/g, "");
    const wantedNoSpaces = wanted.replace(/\s+/g, "");

    if (currentNoSpaces === wantedNoSpaces) return true;
    if (current.includes(wanted) || wanted.includes(current)) return true;

    return true;
  }

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

    const selectionElement = getSelectionElement();
    if (selectionElement) {
      const selectionDocsEditable = getDocsEditableFromTarget(selectionElement);
      if (selectionDocsEditable) return selectionDocsEditable;
    }

    return activeElement;
  }

  const current = document.activeElement;
  const fromActive = current ? getEditableElement(current) : null;
  if (fromActive) return fromActive;

  const fromSelection = getEditableElement(getSelectionElement());
  if (fromSelection) return fromSelection;

  return activeElement;
};
