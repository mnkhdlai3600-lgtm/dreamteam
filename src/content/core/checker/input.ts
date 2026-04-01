import { removeIndicator, updateIndicatorPosition } from "../../ui";
import { getElementText } from "../../dom";
import { shouldSkipHandleInput } from "../guard";
import {
  activeElement,
  cancelPendingRequests,
  clearSuggestion,
  debounceTimer,
  lastAppliedText,
  lastCheckedText,
  setDebounceTimer,
  setIsSuggestionLoading,
  setLastCheckedText,
} from "../state";
import { checkText } from "./request";
import { renderSuggestionIndicator } from "./render";
import { INPUT_DEBOUNCE_MS } from "../../../lib/constants";

const clearPendingDebounce = () => {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
    setDebounceTimer(null);
  }
};

export const handleInput = () => {
  if (shouldSkipHandleInput() || !activeElement) return;

  updateIndicatorPosition(activeElement);

  const text = getElementText(activeElement).trim();

  if (!text) {
    clearPendingDebounce();
    cancelPendingRequests();
    setIsSuggestionLoading(false);
    clearSuggestion();
    removeIndicator();
    return;
  }

  // typing үед dot үргэлж харагдаж байг
  renderSuggestionIndicator();
  updateIndicatorPosition(activeElement);

  if (
    (lastAppliedText && text === lastAppliedText.trim()) ||
    text === lastCheckedText
  ) {
    return;
  }

  clearPendingDebounce();

  setDebounceTimer(
    window.setTimeout(() => {
      if (shouldSkipHandleInput() || !activeElement) return;

      const latestText = getElementText(activeElement).trim();

      if (!latestText) {
        clearPendingDebounce();
        cancelPendingRequests();
        setIsSuggestionLoading(false);
        clearSuggestion();
        removeIndicator();
        return;
      }

      if (
        (lastAppliedText && latestText === lastAppliedText.trim()) ||
        latestText === lastCheckedText
      ) {
        return;
      }

      setIsSuggestionLoading(true);
      setLastCheckedText(latestText);
      renderSuggestionIndicator();
      updateIndicatorPosition(activeElement);

      void checkText(latestText).finally(() => {
        if (!activeElement) {
          removeIndicator();
          return;
        }

        const currentText = getElementText(activeElement).trim();

        if (!currentText) {
          clearSuggestion();
          removeIndicator();
          return;
        }

        setIsSuggestionLoading(false);
        renderSuggestionIndicator();
        updateIndicatorPosition(activeElement);
      });
    }, INPUT_DEBOUNCE_MS),
  );
};
