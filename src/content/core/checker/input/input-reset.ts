import { renderSuggestionIndicator } from "../render";
import { updateIndicatorPosition } from "../../../ui";
import { cancelPendingRequests, clearSuggestion } from "../../state";
import {
  resetIndicatorVisualState,
  resetDocsFrozenBaseText,
  setIndicatorVisualState,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckedText,
  setSuggestionPhase,
} from "../../state";
import {
  isGoogleDocsSite,
  resetGoogleDocsTextCache,
  setGoogleDocsTextCache,
} from "../../../dom/google-docs";
import { getVisualStateFromText } from "./input-compare";
import { clearPendingDebounce } from "./input-debounce";

export const resetEmptyState = (editable: HTMLElement) => {
  clearPendingDebounce();
  cancelPendingRequests();
  setIsSuggestionLoading(false);
  clearSuggestion();
  setLastCheckedText("");
  setLastAppliedText(null);

  if (isGoogleDocsSite()) {
    resetGoogleDocsTextCache();
    resetDocsFrozenBaseText();
  }

  resetIndicatorVisualState();
  setSuggestionPhase("idle");
  renderSuggestionIndicator();
  updateIndicatorPosition(editable);
};

export const resetDocsSuggestionState = (
  editable: HTMLElement,
  text: string,
) => {
  clearPendingDebounce();
  cancelPendingRequests();
  clearSuggestion();
  setIsSuggestionLoading(false);
  setLastCheckedText("");
  setLastAppliedText(null);
  resetGoogleDocsTextCache();
  setGoogleDocsTextCache(text);
  setSuggestionPhase("typing");
  setIndicatorVisualState(getVisualStateFromText(text));
  renderSuggestionIndicator();
  updateIndicatorPosition(editable);
};
