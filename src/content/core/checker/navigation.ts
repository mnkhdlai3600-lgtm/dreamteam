import { refreshSuggestionDropdownHighlight } from "../../ui/dropdown";
import {
  latestSuggestions,
  selectedSuggestionIndex,
  selectSuggestionByIndex,
} from "../state";

export const selectNextSuggestion = () => {
  if (!latestSuggestions.length) return;
  selectSuggestionByIndex(selectedSuggestionIndex + 1);
  refreshSuggestionDropdownHighlight();
};

export const selectPreviousSuggestion = () => {
  if (!latestSuggestions.length) return;
  selectSuggestionByIndex(selectedSuggestionIndex - 1);
  refreshSuggestionDropdownHighlight();
};

export const hasOpenSuggestions = () => {
  return latestSuggestions.length > 0;
};
