import {
  activeElement,
  hasSuggestions,
  isSuggestionLoading,
  latestSuggestions,
  selectedSuggestionIndex,
  suggestionPhase,
} from "../state";
import { getHoveredErrorId } from "../error-state";
import { createIndicator, removeIndicator } from "../../ui";
import { getEditableMode } from "../../dom";

export const renderSuggestionIndicator = () => {
  if (!activeElement) {
    removeIndicator();
    return;
  }

  if (suggestionPhase === "loading" || isSuggestionLoading) {
    void createIndicator(activeElement, "", { state: "loading" });
    return;
  }

  if (suggestionPhase === "typing") {
    return;
  }

  if (suggestionPhase === "suggesting") {
    if (!hasSuggestions() || latestSuggestions.length === 0) {
      removeIndicator();
      return;
    }

    const mode = getEditableMode(activeElement);

    if (mode === "contenteditable-inline" && !getHoveredErrorId()) {
      removeIndicator();
      return;
    }

    void createIndicator(activeElement, "", {
      suggestions: latestSuggestions,
      selectedIndex: selectedSuggestionIndex,
    });

    return;
  }

  removeIndicator();
};
