import { verifyElementText } from "../editable";
import {
  createFragmentFromText,
  dispatchSyntheticInput,
  placeCursorAtEnd,
} from "../selection";
import {
  getGoogleDocsEventTarget,
  getGoogleDocsIframeBody,
  isGoogleDocsSite,
  setGoogleDocsTextCache,
  syncGoogleDocsTextCache,
} from "../google-docs";

const getOwnerDocument = (root: HTMLElement) => root.ownerDocument || document;

const getSelectionForRoot = (root: HTMLElement) => {
  const ownerDocument = getOwnerDocument(root);
  const view = ownerDocument.defaultView;
  return view?.getSelection?.() ?? ownerDocument.getSelection?.() ?? null;
};

const execInsertText = (root: HTMLElement, value: string) => {
  const ownerDocument = getOwnerDocument(root);

  try {
    const ok = ownerDocument.execCommand?.("insertText", false, value);
    if (ok) {
      dispatchSyntheticInput(root, "insertReplacementText", value);
      return true;
    }
  } catch {}

  try {
    const ok = document.execCommand?.("insertText", false, value);
    if (ok) {
      dispatchSyntheticInput(root, "insertReplacementText", value);
      return true;
    }
  } catch {}

  return false;
};

const execSelectAllForGoogleDocs = (root: HTMLElement) => {
  const selection = getSelectionForRoot(root);
  if (!selection) return false;

  try {
    root.focus();

    const ownerDocument = getOwnerDocument(root);
    const range = ownerDocument.createRange();
    range.selectNodeContents(root);

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
};

const execSelectAllForDefaultEditable = (root: HTMLElement) => {
  const ownerDocument = getOwnerDocument(root);

  try {
    const ok = ownerDocument.execCommand?.("selectAll", false);
    if (ok) return true;
  } catch {}

  try {
    const ok = document.execCommand?.("selectAll", false);
    if (ok) return true;
  } catch {}

  const selection = getSelectionForRoot(root);
  if (!selection) return false;

  try {
    const range = ownerDocument.createRange();
    range.selectNodeContents(root);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
};

const getGoogleDocsReplaceTarget = (root: HTMLElement) => {
  return getGoogleDocsIframeBody() ?? getGoogleDocsEventTarget() ?? root;
};

const replaceAllGoogleDocsText = (root: HTMLElement, value: string) => {
  const docsTarget = getGoogleDocsReplaceTarget(root);
  docsTarget.focus();

  const selected = execSelectAllForGoogleDocs(docsTarget);
  if (!selected) return false;

  const inserted = execInsertText(docsTarget, value);
  if (!inserted) return false;

  setGoogleDocsTextCache(value);

  window.setTimeout(() => {
    syncGoogleDocsTextCache(docsTarget);
  }, 30);

  window.setTimeout(() => {
    syncGoogleDocsTextCache(docsTarget);
  }, 120);

  return true;
};

export const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(
    element,
    value,
  );
};

export const normalizeComparableText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .trim();

const replaceAllEditableTextByDom = (root: HTMLElement, value: string) => {
  while (root.firstChild) {
    root.removeChild(root.firstChild);
  }

  root.appendChild(createFragmentFromText(value));
  placeCursorAtEnd(root);
  dispatchSyntheticInput(root, "insertReplacementText", value);
  return verifyElementText(root, value);
};

export const replaceSelectedTextWithCommand = (
  root: HTMLElement,
  value: string,
) => {
  root.focus();
  return execInsertText(root, value);
};

export const replaceAllEditableText = (root: HTMLElement, value: string) => {
  if (isGoogleDocsSite()) {
    return replaceAllGoogleDocsText(root, value);
  }

  root.focus();

  const selected = execSelectAllForDefaultEditable(root);
  if (!selected) {
    return replaceAllEditableTextByDom(root, value);
  }

  const commandOk = replaceSelectedTextWithCommand(root, value);

  if (commandOk) {
    placeCursorAtEnd(root);

    const verified = verifyElementText(root, value);
    if (verified) {
      return true;
    }

    console.log("[болор][replace-fallback-after-command]", {
      root,
      value,
      current:
        root instanceof HTMLElement
          ? root.innerText || root.textContent || ""
          : "",
    });
  }

  return replaceAllEditableTextByDom(root, value);
};
