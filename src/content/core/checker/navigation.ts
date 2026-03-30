import { refreshSuggestionDropdownHighlight } from "../../ui/dropdown";
import {
  latestSuggestions,
  selectedSuggestionIndex,
  selectSuggestionByIndex,
} from "../state";

export const selectNextSuggestion = () => {
  if (latestSuggestions.length <= 1) return;
  selectSuggestionByIndex(selectedSuggestionIndex + 1);
  refreshSuggestionDropdownHighlight();
};

export const selectPreviousSuggestion = () => {
  if (latestSuggestions.length <= 1) return;
  selectSuggestionByIndex(selectedSuggestionIndex - 1);
  refreshSuggestionDropdownHighlight();
};

export const hasOpenSuggestions = () => {
  return latestSuggestions.length > 1;
};
