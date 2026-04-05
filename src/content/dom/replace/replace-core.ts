import { verifyElementText } from "../editable";
import {
  createFragmentFromText,
  dispatchSyntheticInput,
  placeCursorAtEnd,
} from "../selection";

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

  try {
    const ok = document.execCommand("insertText", false, value);

    if (ok) {
      dispatchSyntheticInput(root, "insertReplacementText", value);
      return true;
    }
  } catch {}

  return false;
};

export const replaceAllEditableText = (root: HTMLElement, value: string) => {
  root.focus();

  const selection = window.getSelection();
  if (!selection) return false;

  const range = document.createRange();
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
