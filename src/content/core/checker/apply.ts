import { renderSuggestionIndicator } from "./render";
import { removeSuggestionDropdown, updateIndicatorPosition } from "../../ui";
import {
  getElementText,
  resolveActiveEditable,
  verifyElementText,
  setElementText,
  clearHighlights,
  flashCorrectedWord,
} from "../../dom";
import { shouldSkipApplySuggestion } from "../guard";
import {
  clearSuggestion,
  latestSuggestion,
  setActiveElement,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setIsApplyingHotkey,
  setIsApplyingSuggestion,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckedText,
  setLatestSuggestion,
  setSuggestionPhase,
  selectedErrorRange,
  clearSelectedErrorRange,
  setShouldAutoAdvanceError,
  cancelPendingRequests,
  debounceTimer,
  setDebounceTimer,
} from "../state";
import { APPLY_GUARD_MS, APPLY_RESET_MS } from "../../../lib/constants";
import { checkText } from "./request";

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
  const resolved = resolveActiveEditable();
  if (shouldSkipApplySuggestion() || !resolved || !latestSuggestion) return;

  setActiveElement(resolved);

  const currentText = getElementText(resolved).trim();
  if (!currentText) return;

  setIsApplyingHotkey(true);

  const suggestion = latestSuggestion;
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

      if (hasSavedRange || hasLiveSelection) {
        nextText = replaceSelectedRangeInInput(resolved, suggestion);
        ok = true;
      } else {
        resolved.value = suggestion;
        const nextCaret = suggestion.length;
        resolved.setSelectionRange(nextCaret, nextCaret);
        nextText = suggestion;
        ok = true;
      }
    } else {
      ok = setElementText(resolved, suggestion);
      nextText = suggestion;
    }

    if (!ok) {
      clearSelectedErrorRange();
      clearSuggestion();
      setSuggestionPhase("idle");
      setIsSuggestionLoading(false);
      renderSuggestionIndicator();
      updateIndicatorPosition(resolved);
      return;
    }

    setLastAppliedText(nextText);
    setLastCheckedText(nextText.trim());

    console.log("АППЛАЙ ӨМНӨ", {
      nextText,
      selectedErrorRange,
      suggestion,
    });

    if (
      resolved instanceof HTMLInputElement ||
      resolved instanceof HTMLTextAreaElement
    ) {
      clearSuggestion();
      clearSelectedErrorRange();
      setSuggestionPhase("idle");
      setIsSuggestionLoading(false);

      setShouldAutoAdvanceError(true);

      console.log("АППЛАЙ ДАРАА", {
        shouldAutoAdvance: true,
        nextText,
      });

      setActiveElement(resolved);
      void checkText(nextText);
      return;
    }

    clearSuggestion();
    clearSelectedErrorRange();
    setSuggestionPhase("idle");
    setIsSuggestionLoading(false);

    clearHighlights(resolved);
    flashCorrectedWord(resolved, suggestion);

    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);

    renderSuggestionIndicator();
    updateIndicatorPosition(resolved);

    window.setTimeout(() => {
      if (!verifyElementText(resolved, nextText)) return;

      setIndicatorVisualState("idle");
      setIndicatorErrorCount(0);
      renderSuggestionIndicator();
      updateIndicatorPosition(resolved);
    }, 1200);
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), APPLY_RESET_MS);
    window.setTimeout(() => setIsApplyingHotkey(false), APPLY_GUARD_MS);
  }
};
