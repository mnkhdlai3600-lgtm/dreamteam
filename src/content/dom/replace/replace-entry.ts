import {
  setIsApplyingSuggestion,
  setMessengerReplaceInProgress,
  setSuppressInputUntil,
} from "../../core/state";
import { getMessengerEditorRoot, isMessengerSite } from "../editable";
import { getGoogleDocsIframeDocument, isGoogleDocsSite } from "../google-docs";
import { replaceAllEditableText, setNativeValue } from "./replace-core";

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

const replaceGoogleDocsText = (value: string) => {
  const iframeDoc = getGoogleDocsIframeDocument();
  const body = iframeDoc?.body;

  if (!body) return false;

  body.focus();
  return replaceAllEditableText(body as unknown as HTMLElement, value);
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

  if (isGoogleDocsSite()) {
    const replacedDocs = replaceGoogleDocsText(value);
    if (replacedDocs) return true;
  }

  if (el.isContentEditable || el.getAttribute("role") === "textbox") {
    if (isMessengerSite()) {
      return replaceMessengerText(el, value);
    }

    return replaceAllEditableText(el, value);
  }

  return false;
};
