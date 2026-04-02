import {
  activeElement,
  hasSuggestions,
  indicatorErrorCount,
  indicatorVisualState,
  isSuggestionLoading,
  latestSuggestions,
  setLatestSuggestion,
  setSelectedSuggestionIndex,
  suggestionPhase,
} from "../state";
import {
  createIndicator,
  removeIndicator,
  renderSuggestionDropdown,
  removeSuggestionDropdown,
} from "../../ui";
import { applySuggestion } from "./apply";

export const renderSuggestionIndicator = () => {
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
