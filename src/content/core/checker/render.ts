import {
  activeElement,
  getLastEditableElement,
  hasSuggestions,
  indicatorErrorCount,
  indicatorVisualState,
  isSuggestionLoading,
  latestSuggestions,
  setActiveElement,
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
  const target = activeElement ?? getLastEditableElement();

  if (!target) {
    removeIndicator();
    removeSuggestionDropdown();
    return;
  }

  if (target !== activeElement) {
    setActiveElement(target);
  }

  const visualState =
    isSuggestionLoading && indicatorVisualState !== "latin"
      ? "loading"
      : indicatorVisualState;

  try {
    void createIndicator(target, "", {
      state: visualState,
      errorCount: indicatorErrorCount,
      onDotClick:
        visualState === "error"
          ? () => void handleDotClick({ rerender: renderSuggestionIndicator })
          : undefined,
    });
  } catch {
    return;
  }

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
