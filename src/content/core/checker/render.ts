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

console.log("RENDER FILE LOADED 777");

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

  console.log("[болор][рендэр]", {
    suggestionPhase,
    latestSuggestions,
    latestSuggestionCount: latestSuggestions.length,
    hasSuggestionsValue: hasSuggestions(),
    isSuggestionLoading,
    indicatorVisualState,
  });

  const shouldShowDropdown =
    suggestionPhase === "suggesting" &&
    hasSuggestions() &&
    latestSuggestions.length > 0;

  console.log("[болор][рендэр][dropdown-check]", {
    shouldShowDropdown,
    suggestionPhase,
    hasSuggestionsValue: hasSuggestions(),
    latestSuggestionsLength: latestSuggestions.length,
  });

  if (!shouldShowDropdown) {
    removeSuggestionDropdown();
    return;
  }

  removeSuggestionDropdown();

  console.log("[болор][рендэр][dropdown] render start", {
    latestSuggestions,
  });

  void renderSuggestionDropdown((value: string) => {
    console.log("[болор][рендэр][dropdown] onPick fired", {
      value,
      latestSuggestions,
    });

    const index = latestSuggestions.findIndex((item) => item === value);

    console.log("[болор][рендэр][dropdown] picked index", {
      value,
      index,
    });

    if (index >= 0) {
      setSelectedSuggestionIndex(index);
    }

    setLatestSuggestion(value);

    console.log("[болор][рендэр][dropdown] before applySuggestion", {
      value,
    });

    applySuggestion();

    console.log("[болор][рендэр][dropdown] after applySuggestion", {
      value,
    });
  });
};
