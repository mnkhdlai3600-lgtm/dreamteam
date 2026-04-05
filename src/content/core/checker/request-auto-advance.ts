import { updateIndicatorPosition } from "../../ui";
import { resolveActiveEditable } from "../../dom";
import { requestSuggestionsForWord } from "./request-word";
import { renderSuggestionIndicator } from "./render";
import { focusErrorForElement } from "./render-focus";
import {
  clearFocusedErrorId,
  clearSuggestion,
  setActiveElement,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setIsSuggestionLoading,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
  setShouldAutoAdvanceError,
  setSuggestionPhase,
} from "../state";
import type { HighlightErrorItem } from "../error-state";

export const handleAutoAdvance = async (
  currentEditable: HTMLElement,
  items: HighlightErrorItem[],
  errorCount: number,
) => {
  if (!items.length) {
    setShouldAutoAdvanceError(false);
    clearFocusedErrorId();
    return false;
  }

  const target = items[0];
  if (!target) {
    setShouldAutoAdvanceError(false);
    clearFocusedErrorId();
    return false;
  }

  setActiveElement(currentEditable);
  setIndicatorVisualState("error");
  setIndicatorErrorCount(errorCount);
  setIsSuggestionLoading(true);

  const focused = focusErrorForElement(currentEditable, target);
  if (!focused) {
    setIsSuggestionLoading(false);
    setShouldAutoAdvanceError(false);
    clearFocusedErrorId();
    return false;
  }

  try {
    const result = await requestSuggestionsForWord(target.word);

    if (result.suggestions.length > 0) {
      setLatestSuggestions(result.suggestions);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(result.suggestions[0] ?? null);
      setSuggestionPhase("suggesting");
    } else if (result.corrected && result.corrected !== target.word) {
      setLatestSuggestions([result.corrected]);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(result.corrected);
      setSuggestionPhase("suggesting");
    } else {
      clearSuggestion();
      setSuggestionPhase("idle");
    }

    requestAnimationFrame(() => {
      const latestEditable = resolveActiveEditable() ?? currentEditable;
      if (!latestEditable) return;

      setActiveElement(latestEditable);
      latestEditable.focus();

      focusErrorForElement(latestEditable, target);
      renderSuggestionIndicator();
      updateIndicatorPosition(latestEditable);
    });

    return true;
  } catch {
    clearSuggestion();
    clearFocusedErrorId();
    setSuggestionPhase("idle");
    return false;
  } finally {
    setIsSuggestionLoading(false);
    setShouldAutoAdvanceError(false);
  }
};
