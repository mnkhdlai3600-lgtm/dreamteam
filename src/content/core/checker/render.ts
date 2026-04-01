import {
  activeElement,
  hasSuggestions,
  isSuggestionLoading,
  latestSuggestions,
  selectedSuggestionIndex,
  suggestionPhase,
} from "../state";
import { applySuggestion } from "./apply";
import { createIndicator, removeIndicator } from "../../ui";

export const renderSuggestionIndicator = () => {
  if (!activeElement) {
    removeIndicator();
    return;
  }

  if (suggestionPhase === "loading" || isSuggestionLoading) {
    removeIndicator();

    requestAnimationFrame(() => {
      if (!activeElement) return;
      void createIndicator(activeElement, "", { state: "loading" });
    });

    return;
  }

  if (
    suggestionPhase === "suggesting" &&
    hasSuggestions() &&
    latestSuggestions.length > 0
  ) {
    removeIndicator();

    requestAnimationFrame(() => {
      if (!activeElement) return;

      void createIndicator(activeElement, "", {
        suggestions: latestSuggestions,
        selectedIndex: selectedSuggestionIndex,
        onSuggestionClick: () => {
          applySuggestion();
        },
      });
    });

    return;
  }

  if (suggestionPhase === "typing") {
    removeIndicator();

    requestAnimationFrame(() => {
      if (!activeElement) return;
      void createIndicator(activeElement, "", { state: "idle" });
    });

    return;
  }

  removeIndicator();
};
