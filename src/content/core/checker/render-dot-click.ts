import {
  activeElement,
  clearSuggestion,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setSuppressInputUntil,
  setIsSuggestionLoading,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
  setSuggestionPhase,
} from "../state";
import {
  getNextErrorNavigationIndex,
  resetErrorNavigationIndex,
  shouldAutoAdvanceError,
} from "../state";
import { getHighlightedErrors } from "../error-state";
import { removeSuggestionDropdown } from "../../ui";
import { requestSuggestionsForWord } from "./request-word";
import { focusErrorForElement } from "./render-focus";

type HandleDotClickParams = {
  rerender: () => void;
};

export const handleDotClick = async ({ rerender }: HandleDotClickParams) => {
  if (!activeElement) return;

  const errors = getHighlightedErrors();

  clearSuggestion();
  removeSuggestionDropdown();

  if (!errors.length) {
    resetErrorNavigationIndex();
    return;
  }

  if (!shouldAutoAdvanceError) {
    resetErrorNavigationIndex();
  }

  setIndicatorVisualState("error");
  setIndicatorErrorCount(errors.length);
  setSuppressInputUntil(Date.now() + 1200);
  setIsSuggestionLoading(true);
  setSuggestionPhase("loading");

  const index = getNextErrorNavigationIndex(errors.length);
  const target = errors[index];

  if (!target) {
    setIsSuggestionLoading(false);
    setSuggestionPhase("idle");
    return;
  }

  focusErrorForElement(activeElement, target);

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
  } catch {
    clearSuggestion();
    setSuggestionPhase("idle");
  } finally {
    setIsSuggestionLoading(false);
    rerender();
  }
};
