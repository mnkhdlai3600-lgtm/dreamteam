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
import { handleDotClick } from "./render-dot-click";

export const renderSuggestionIndicator = () => {
  if (!activeElement) {
    removeIndicator();
    removeSuggestionDropdown();
    return;
  }

  const visualState =
    isSuggestionLoading && indicatorVisualState !== "latin"
      ? "loading"
      : indicatorVisualState;

  void createIndicator(activeElement, "", {
    state: visualState,
    errorCount: indicatorErrorCount,
    onDotClick:
      visualState === "error"
        ? () => void handleDotClick({ rerender: renderSuggestionIndicator })
        : undefined,
  });

  const shouldShowDropdown =
    suggestionPhase === "suggesting" &&
    hasSuggestions() &&
    latestSuggestions.length > 0;

  if (!shouldShowDropdown) {
    removeSuggestionDropdown();
    return;
  }

  removeSuggestionDropdown();

  void renderSuggestionDropdown((value: string) => {
    const index = latestSuggestions.findIndex((item) => item === value);

    if (index >= 0) {
      setSelectedSuggestionIndex(index);
    }

    setLatestSuggestion(value);
    applySuggestion();
  });
};
