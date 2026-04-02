import {
  activeElement,
  clearSuggestion,
  hasSuggestions,
  indicatorErrorCount,
  indicatorVisualState,
  isSuggestionLoading,
  latestSuggestions,
  setLatestSuggestion,
  setSelectedSuggestionIndex,
  suggestionPhase,
  setIndicatorVisualState,
  setIndicatorErrorCount,
  setSuppressInputUntil,
  setIsSuggestionLoading,
  setLatestSuggestions,
  setSuggestionPhase,
  setSelectedErrorRange,
  clearSelectedErrorRange,
} from "../state";
import {
  createIndicator,
  removeIndicator,
  renderSuggestionDropdown,
  removeSuggestionDropdown,
} from "../../ui";
import { applySuggestion } from "./apply";
import {
  getNextErrorNavigationIndex,
  resetErrorNavigationIndex,
} from "../state";
import { getHighlightedErrors } from "../error-state";
import { focusHighlightedErrorById } from "../../dom";
import type { HighlightErrorItem } from "../error-state";
import { requestSuggestionsForWord } from "./request";

export const renderSuggestionIndicator = () => {
  const focusErrorForElement = (
    element: HTMLElement,
    item: HighlightErrorItem,
  ) => {
    clearSelectedErrorRange();

    if (
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement) &&
      typeof item.start === "number" &&
      typeof item.end === "number"
    ) {
      element.focus();
      element.setSelectionRange(item.start, item.end);
      setSelectedErrorRange({
        start: item.start,
        end: item.end,
      });
      return true;
    }

    if (item.id) {
      return focusHighlightedErrorById(element, item.id);
    }

    return false;
  };

  const handleDotClick = async () => {
    if (!activeElement) return;

    const errors = getHighlightedErrors();

    clearSuggestion();
    removeSuggestionDropdown();

    if (!errors.length) {
      resetErrorNavigationIndex();
      return;
    }

    setIndicatorVisualState("error");
    setIndicatorErrorCount(errors.length);
    setSuppressInputUntil(Date.now() + 1200);
    setIsSuggestionLoading(true);
    setSuggestionPhase("loading");

    const index = getNextErrorNavigationIndex(errors.length);
    const target = errors[index];

    if (!target) {
      clearSelectedErrorRange();
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
      renderSuggestionIndicator();
    }
  };
  if (!activeElement) {
    removeIndicator();
    removeSuggestionDropdown();
    return;
  }

  const visualState =
    isSuggestionLoading && indicatorVisualState === "idle"
      ? "loading"
      : indicatorVisualState;

  void createIndicator(activeElement, "", {
    state: visualState,
    errorCount: indicatorErrorCount,
    onDotClick: visualState === "error" ? handleDotClick : undefined,
  });

  if (
    suggestionPhase === "suggesting" &&
    hasSuggestions() &&
    latestSuggestions.length > 0
  ) {
    void renderSuggestionDropdown((value: string) => {
      const index = latestSuggestions.findIndex((item) => item === value);

      if (index >= 0) {
        setSelectedSuggestionIndex(index);
      }

      setLatestSuggestion(value);
      applySuggestion();
    });

    return;
  }

  removeSuggestionDropdown();
};
