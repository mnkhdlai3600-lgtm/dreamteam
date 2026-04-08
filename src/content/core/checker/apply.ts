import { renderSuggestionIndicator } from "./render";
import { removeSuggestionDropdown, updateIndicatorPosition } from "../../ui";
import {
  getElementText,
  resolveActiveEditable,
  setElementText,
  replaceHighlightedErrorText,
  replaceRangeInContentEditable,
  replaceCurrentSelectionInContentEditable,
} from "../../dom";
import {
  getGoogleDocsTextCache,
  isGoogleDocsSite,
  resolveGoogleDocsActiveEditable,
  syncGoogleDocsTextCache,
} from "../../dom/google-docs";
import { getHighlightedErrors } from "../error-state";
import { shouldSkipApplySuggestion } from "../guard";
import {
  activeElement,
  cancelPendingRequests,
  clearFocusedErrorId,
  clearSelectedErrorRange,
  clearSuggestion,
  debounceTimer,
  focusedErrorId,
  getLastEditableElement,
  lastCheckedText,
  latestSuggestion,
  selectedErrorRange,
  setActiveElement,
  setDebounceTimer,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setIsApplyingHotkey,
  setIsApplyingSuggestion,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckedText,
  setLatestSuggestion,
  setShouldAutoAdvanceError,
  setSuggestionPhase,
} from "../state";
import { APPLY_GUARD_MS, APPLY_RESET_MS } from "../../../lib/constants";
import { checkText } from "./request";

console.log("APPLY FILE LOADED 777");

const hasLatinText = (text: string) => /[A-Za-z]/.test(text);

const replaceSelectedRangeInInput = (
  element: HTMLInputElement | HTMLTextAreaElement,
  replacement: string,
) => {
  const rangeStart = selectedErrorRange?.start ?? element.selectionStart ?? 0;
  const rangeEnd =
    selectedErrorRange?.end ?? element.selectionEnd ?? rangeStart;

  const currentValue = element.value;
  const nextValue =
    currentValue.slice(0, rangeStart) +
    replacement +
    currentValue.slice(rangeEnd);

  element.value = nextValue;

  const nextCaret = rangeStart + replacement.length;
  element.setSelectionRange(nextCaret, nextCaret);

  console.log("[болор][apply][input-range]", {
    rangeStart,
    rangeEnd,
    replacement,
    nextValue,
  });

  return nextValue;
};

const buildNextTextForDocs = (
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

const applyDocsReplace = async (nextText: string) => {
  const response = await chrome.runtime.sendMessage({
    type: "DOCS_DEBUGGER_REPLACE",
    payload: { text: nextText },
  });

  return !!response?.success;
};

export const applySuggestion = async () => {
  console.log("APPLY FUNCTION FIRED 777");

  const resolved =
    activeElement ?? resolveActiveEditable() ?? getLastEditableElement();
  const suggestion = latestSuggestion;
  const targetErrorId = focusedErrorId;
  const docsSite = isGoogleDocsSite();

  console.log("[болор][apply] start", {
    suggestion,
    resolved,
    activeElement,
    lastEditable: getLastEditableElement(),
    targetErrorId,
    selectedErrorRange,
    docsSite,
  });

  const skipped = shouldSkipApplySuggestion();
  if (skipped || !resolved || !suggestion) {
    console.log("[болор][apply] skipped", {
      skipped,
      hasResolved: !!resolved,
      hasSuggestion: !!suggestion,
    });
    return;
  }

  if (!docsSite) {
    setActiveElement(resolved);
  }

  const currentText = docsSite
    ? syncGoogleDocsTextCache() ||
      getGoogleDocsTextCache() ||
      lastCheckedText.trim()
    : getElementText(resolved).trim();

  console.log("[болор][apply] current-text", {
    resolved,
    docsSite,
    currentText,
  });

  if (!currentText) {
    console.log("[болор][apply] empty-current-text", { resolved, docsSite });
    return;
  }

  const isLatinInput = hasLatinText(currentText);
  const targetError = targetErrorId
    ? (getHighlightedErrors().find((item) => item.id === targetErrorId) ?? null)
    : null;

  setIsApplyingHotkey(true);
  setLatestSuggestion(null);
  setIsApplyingSuggestion(true);
  setIsSuggestionLoading(false);

  try {
    removeSuggestionDropdown();

    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    cancelPendingRequests();

    let ok = false;
    let nextText = currentText;

    if (
      resolved instanceof HTMLInputElement ||
      resolved instanceof HTMLTextAreaElement
    ) {
      const hasSavedRange =
        !!selectedErrorRange &&
        selectedErrorRange.end > selectedErrorRange.start;

      const hasLiveSelection =
        (resolved.selectionStart ?? 0) !== (resolved.selectionEnd ?? 0);

      if (!isLatinInput && (hasSavedRange || hasLiveSelection)) {
        nextText = replaceSelectedRangeInInput(resolved, suggestion);
        ok = true;
      } else {
        resolved.value = suggestion;
        resolved.setSelectionRange(suggestion.length, suggestion.length);
        nextText = suggestion;
        ok = true;
      }
    } else if (docsSite) {
      nextText = isLatinInput
        ? suggestion
        : buildNextTextForDocs(currentText, suggestion, targetError?.word);

      const docsTarget = resolveGoogleDocsActiveEditable() ?? resolved;

      console.log("[болор][apply][docs] prepared", {
        currentText,
        nextText,
        changed: nextText !== currentText,
        docsTarget,
      });

      if (nextText !== currentText) {
        ok = await applyDocsReplace(nextText);
      }
    } else if (isLatinInput) {
      ok = await setElementText(resolved, suggestion);
      nextText = suggestion;
    } else {
      ok = replaceCurrentSelectionInContentEditable(
        resolved,
        suggestion,
        targetError?.word,
      );

      if (
        !ok &&
        selectedErrorRange &&
        selectedErrorRange.end > selectedErrorRange.start
      ) {
        ok = replaceRangeInContentEditable(
          resolved,
          selectedErrorRange.start,
          selectedErrorRange.end,
          suggestion,
          targetError?.word,
        );
      }

      if (!ok && targetErrorId) {
        ok = replaceHighlightedErrorText(resolved, targetErrorId, suggestion);
      }

      nextText = getElementText(resolved).trim();
    }

    if (!ok) {
      console.log("[болор][apply] failed", {
        docsSite,
        isLatinInput,
        currentText,
        nextText,
        resolved,
      });

      renderSuggestionIndicator();
      updateIndicatorPosition(resolved);
      return;
    }

    clearSuggestion();
    clearSelectedErrorRange();
    clearFocusedErrorId();
    setSuggestionPhase("idle");
    setIsSuggestionLoading(false);

    setLastAppliedText(nextText);
    setLastCheckedText(nextText.trim());
    setShouldAutoAdvanceError(!isLatinInput && !docsSite);

    if (docsSite) {
      window.setTimeout(() => {
        syncGoogleDocsTextCache();
      }, 150);
    }

    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);
    renderSuggestionIndicator();
    updateIndicatorPosition(resolved);

    window.setTimeout(() => {
      void checkText(nextText);
    }, 250);
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), APPLY_RESET_MS);
    window.setTimeout(() => setIsApplyingHotkey(false), APPLY_GUARD_MS);
  }
};
