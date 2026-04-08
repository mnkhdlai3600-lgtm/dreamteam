import {
  getGoogleDocsTextCache,
  resetGoogleDocsTextCache,
  resolveGoogleDocsActiveEditable,
  scheduleGoogleDocsTextResync,
  setGoogleDocsTextCache,
  syncGoogleDocsTextCache,
} from "../../../dom/google-docs";
import { lastCheckedText, selectedErrorRange } from "../../state";

export const buildNextTextForDocs = (
  currentText: string,
  replacement: string,
  expectedWord?: string,
) => {
  if (
    selectedErrorRange &&
    selectedErrorRange.end > selectedErrorRange.start &&
    selectedErrorRange.start >= 0 &&
    selectedErrorRange.end <= currentText.length
  ) {
    const selectedText = currentText.slice(
      selectedErrorRange.start,
      selectedErrorRange.end,
    );

    if (!expectedWord || selectedText === expectedWord) {
      return (
        currentText.slice(0, selectedErrorRange.start) +
        replacement +
        currentText.slice(selectedErrorRange.end)
      );
    }
  }

  if (expectedWord) {
    const wordIndex = currentText.indexOf(expectedWord);
    if (wordIndex >= 0) {
      return (
        currentText.slice(0, wordIndex) +
        replacement +
        currentText.slice(wordIndex + expectedWord.length)
      );
    }
  }

  return currentText;
};

export const applyDocsReplace = async (nextText: string) => {
  const response = await chrome.runtime.sendMessage({
    type: "DOCS_DEBUGGER_REPLACE",
    payload: { text: nextText },
  });

  return !!response?.success;
};

export const getDocsCurrentText = (resolved: HTMLElement) => {
  return (
    syncGoogleDocsTextCache(resolved).trim() ||
    getGoogleDocsTextCache().trim() ||
    lastCheckedText.trim()
  );
};

export const syncDocsStateAfterApply = (
  resolved: HTMLElement,
  nextText: string,
) => {
  resetGoogleDocsTextCache();
  setGoogleDocsTextCache(nextText);
  scheduleGoogleDocsTextResync(resolveGoogleDocsActiveEditable() ?? resolved);
};

export const applySuggestionToDocs = async (
  currentText: string,
  suggestion: string,
  isLatinInput: boolean,
  expectedWord?: string,
) => {
  const nextText = isLatinInput
    ? suggestion.trim()
    : buildNextTextForDocs(currentText, suggestion, expectedWord);

  if (nextText === currentText) {
    return {
      ok: false,
      nextText: currentText,
    };
  }

  const ok = await applyDocsReplace(nextText);

  return {
    ok,
    nextText,
  };
};
