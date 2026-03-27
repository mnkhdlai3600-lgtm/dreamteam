import {
  setIsApplyingSuggestion,
  setMessengerReplaceInProgress,
  setSuppressInputUntil,
} from "../core/state";
import {
  getMessengerEditorRoot,
  isMessengerSite,
  verifyElementText,
} from "./editable";
import {
  createFragmentFromText,
  dispatchSyntheticInput,
  placeCursorAtEnd,
} from "./selection";

const setNativeValue = (
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

const replaceMessengerText = (inputEl: HTMLElement, value: string) => {
  const el = getMessengerEditorRoot(inputEl) ?? inputEl;
  el.focus();

  setMessengerReplaceInProgress(true);
  setSuppressInputUntil(Date.now() + 3000);
  setIsApplyingSuggestion(true);

  try {
    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);

    let ok = false;
    try {
      ok = document.execCommand("insertText", false, value);
    } catch {
      ok = false;
    }

    placeCursorAtEnd(el);
    return ok || verifyElementText(el, value);
  } catch (error) {
    console.error("replaceMessengerText error:", error);
    return false;
  } finally {
    window.setTimeout(() => {
      setMessengerReplaceInProgress(false);
      setIsApplyingSuggestion(false);
    }, 700);
  }
};

const replaceNormalContentEditableText = (el: HTMLElement, value: string) => {
  el.focus();
  while (el.firstChild) el.removeChild(el.firstChild);
  el.appendChild(createFragmentFromText(value));
  placeCursorAtEnd(el);
  dispatchSyntheticInput(el, "insertReplacementText", value);
  return true;
};

export const setElementText = (el: HTMLElement, value: string) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus();
    setNativeValue(el, value);
    el.setSelectionRange?.(value.length, value.length);

    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType: "insertReplacementText",
        data: value,
      }),
    );

    return true;
  }

  if (el.isContentEditable || el.getAttribute("role") === "textbox") {
    return isMessengerSite()
      ? replaceMessengerText(el, value)
      : replaceNormalContentEditableText(el, value);
  }

  return false;
};
