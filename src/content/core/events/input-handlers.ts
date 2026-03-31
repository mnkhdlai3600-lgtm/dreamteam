import { removeIndicator, updateIndicatorPosition } from "../../ui";
import { getElementText } from "../../dom";
import { shouldSkipHandleInput } from "../guard";
import {
  activeElement,
  clearSuggestion,
  debounceTimer,
  lastAppliedText,
  lastCheckedText,
  setDebounceTimer,
  setIsSuggestionLoading,
  setLastCheckedText,
} from "../state";
import { checkText } from "../checker/request";
import { renderSuggestionIndicator } from "../checker/render";
import { INPUT_DEBOUNCE_MS } from "../../constants";

export const handleInput = () => {
  if (shouldSkipHandleInput() || !activeElement) return;

  updateIndicatorPosition(activeElement);

  const text = getElementText(activeElement).trim();

  if (!text) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  if (
    (lastAppliedText && text === lastAppliedText.trim()) ||
    text === lastCheckedText
  ) {
    return;
  }

  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  setDebounceTimer(
    window.setTimeout(() => {
      if (shouldSkipHandleInput() || !activeElement) return;

      updateIndicatorPosition(activeElement);

      const latestText = getElementText(activeElement).trim();

      if (!latestText) {
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
      renderSuggestionIndicator();
      updateIndicatorPosition(activeElement);
      setLastCheckedText(latestText);

      void checkText(latestText).finally(() => {
        setIsSuggestionLoading(false);

        if (!activeElement) return;

        renderSuggestionIndicator();
        updateIndicatorPosition(activeElement);
      });
    }, INPUT_DEBOUNCE_MS),
  );
};
