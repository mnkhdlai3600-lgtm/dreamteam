import { createIndicator } from "../../ui/indicator";
import {
  activeElement,
  hasSuggestions,
  latestSuggestion,
  latestSuggestions,
  selectedSuggestionIndex,
  selectSuggestionByIndex,
} from "../state";
import { applySuggestion } from "./apply";

export const renderSuggestionIndicator = () => {
  if (!activeElement || !hasSuggestions()) return;

  if (latestSuggestions.length > 1) {
    void createIndicator(activeElement, "↑ ↓ сонгоно • Enter хэрэглэнэ", {
      suggestions: latestSuggestions,
      selectedIndex: selectedSuggestionIndex,
      onSuggestionClick: (index) => {
        const chosen = latestSuggestions[index];
        if (!chosen) return;

        selectSuggestionByIndex(index);
        applySuggestion();
      },
    });
    return;
  }

  if (latestSuggestion) {
    void createIndicator(
      activeElement,
      `Option+Space дарж засна: ${latestSuggestion}`,
    );
  }
};
