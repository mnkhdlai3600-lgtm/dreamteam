import {
  activeElement,
  hasSuggestions,
  isSuggestionLoading,
  latestSuggestions,
  selectedSuggestionIndex,
} from "../state";
import { applySuggestion } from "./apply";
import { createIndicator, removeIndicator } from "../../ui/indicator-render";

export const renderSuggestionIndicator = () => {
  if (!activeElement) {
    removeIndicator();
    return;
  }

  if (hasSuggestions() && latestSuggestions.length > 0) {
    void createIndicator(activeElement, "", {
      suggestions: latestSuggestions,
      selectedIndex: selectedSuggestionIndex,
      onSuggestionClick: () => {
        applySuggestion();
      },
    });
    return;
  }

  if (isSuggestionLoading) {
    void createIndicator(activeElement, "", { state: "loading" });
    return;
  }

  void createIndicator(activeElement, "", { state: "idle" });
};
