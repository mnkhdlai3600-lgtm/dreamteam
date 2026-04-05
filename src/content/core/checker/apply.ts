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
  latestSuggestion,
  selectedErrorRange,
  setActiveElement,
  setDebounceTimer,
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

  return nextValue;
};

export const applySuggestion = () => {
  const resolved = activeElement ?? resolveActiveEditable();
  const suggestion = latestSuggestion;
  const targetErrorId = focusedErrorId;

  if (shouldSkipApplySuggestion() || !resolved || !suggestion) return;

  setActiveElement(resolved);

  const currentText = getElementText(resolved).trim();
  if (!currentText) return;

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
    } else if (isLatinInput) {
      ok = setElementText(resolved, suggestion);
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

    clearSuggestion();
    clearSelectedErrorRange();
    clearFocusedErrorId();
    setSuggestionPhase("idle");
    setIsSuggestionLoading(false);

    if (!ok) {
      renderSuggestionIndicator();
      updateIndicatorPosition(resolved);
      return;
    }

    setLastAppliedText(nextText);
    setLastCheckedText(nextText.trim());
    setActiveElement(resolved);
    setShouldAutoAdvanceError(!isLatinInput);

    void checkText(nextText);
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), APPLY_RESET_MS);
    window.setTimeout(() => setIsApplyingHotkey(false), APPLY_GUARD_MS);
  }
};
