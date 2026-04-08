import {
  getGoogleDocsEventTarget,
  getGoogleDocsIframeBody,
  getGoogleDocsIframeDocument,
  isGoogleDocsSite,
  resolveGoogleDocsActiveEditable,
} from "../google-docs";
import {
  DOCS_EVENT_TARGET_SELECTORS,
  asHtmlElement,
  isEditableElement,
} from "./guards";
import { isGmailSite, isMessengerSite } from "./sites";

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

export const getDocsEditableFromTarget = (target: EventTarget | null) => {
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
