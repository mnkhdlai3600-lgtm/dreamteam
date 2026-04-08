import {
  setIsApplyingSuggestion,
  setMessengerReplaceInProgress,
  setSuppressInputUntil,
} from "../../core/state";
import { getMessengerEditorRoot, isMessengerSite } from "../editable";
import { isGoogleDocsSite, replaceGoogleDocsText } from "../google-docs";
import { replaceAllEditableText, setNativeValue } from "./core";

const replaceMessengerText = (inputEl: HTMLElement, value: string) => {
  const el = getMessengerEditorRoot(inputEl) ?? inputEl;
  el.focus();

  setMessengerReplaceInProgress(true);
  setSuppressInputUntil(Date.now() + 3000);
  setIsApplyingSuggestion(true);

  try {
    return replaceAllEditableText(el, value);
  } finally {
    window.setTimeout(() => {
      setMessengerReplaceInProgress(false);
      setIsApplyingSuggestion(false);
    }, 700);
  }
};

export const setElementText = async (el: HTMLElement, value: string) => {
  console.log("[болор][setElementText] enter", {
    el,
    tag: el?.tagName,
    role: el?.getAttribute?.("role"),
    isDocs: isGoogleDocsSite(),
    isContentEditable: el?.isContentEditable,
    value,
  });

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    console.log("[болор][setElementText] input-textarea");
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

  if (isGoogleDocsSite()) {
    console.log("[болор][setElementText] docs-branch");
    return await replaceGoogleDocsText(value);
  }

  if (el.isContentEditable || el.getAttribute("role") === "textbox") {
    console.log("[болор][setElementText] contenteditable-branch");

    if (isMessengerSite()) {
      console.log("[болор][setElementText] messenger-branch");
      return replaceMessengerText(el, value);
    }

    return replaceAllEditableText(el, value);
  }

  console.log("[болор][setElementText] no-branch");
  return false;
};
