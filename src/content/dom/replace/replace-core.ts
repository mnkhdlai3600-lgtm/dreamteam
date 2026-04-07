import { verifyElementText } from "../editable";
import {
  createFragmentFromText,
  dispatchSyntheticInput,
  placeCursorAtEnd,
} from "../selection";

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

export const replaceSelectedTextWithCommand = (
  root: HTMLElement,
  value: string,
) => {
  root.focus();
  return execInsertText(root, value);
};

export const replaceAllEditableText = (root: HTMLElement, value: string) => {
  root.focus();

  const selection = getSelectionForRoot(root);
  if (!selection) return false;

  const ownerDocument = getOwnerDocument(root);
  const range = ownerDocument.createRange();

  range.selectNodeContents(root);
  selection.removeAllRanges();
  selection.addRange(range);

  if (replaceSelectedTextWithCommand(root, value)) {
    placeCursorAtEnd(root);
    return verifyElementText(root, value);
  }

  while (root.firstChild) {
    root.removeChild(root.firstChild);
  }

  root.appendChild(createFragmentFromText(value));
  placeCursorAtEnd(root);
  dispatchSyntheticInput(root, "insertReplacementText", value);
  return verifyElementText(root, value);
};
