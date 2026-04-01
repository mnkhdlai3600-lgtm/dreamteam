import { updateIndicatorPosition } from "../../ui";
import { getElementText } from "../../dom";
import { shouldSkipHandleInput } from "../guard";
import {
  activeElement,
  clearSuggestion,
  debounceTimer,
  lastAppliedText,
  nextRequestId,
  isLatestRequest,
  setDebounceTimer,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckedText,
  setSuggestionPhase,
} from "../state";
import { checkText } from "../checker/request";
import { renderSuggestionIndicator } from "../checker/render";
import { INPUT_DEBOUNCE_MS } from "../../../lib/constants";

export const handleInput = () => {
  if (shouldSkipHandleInput() || !activeElement) return;

  updateIndicatorPosition(activeElement);

  const text = getElementText(activeElement).trim();

  if (!text) {
    clearSuggestion();
    setLastAppliedText(null);
    setLastCheckedText("");
    setSuggestionPhase("idle");
    void renderSuggestionIndicator();
    updateIndicatorPosition(activeElement);
    return;
  }

  if (lastAppliedText && text !== lastAppliedText.trim()) {
    setLastAppliedText(null);
  }

  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  setSuggestionPhase("typing");
  void renderSuggestionIndicator();
  updateIndicatorPosition(activeElement);

  const requestId = nextRequestId();

  setDebounceTimer(
    window.setTimeout(() => {
      if (shouldSkipHandleInput() || !activeElement) return;

      updateIndicatorPosition(activeElement);

      const latestText = getElementText(activeElement).trim();

      if (!latestText) {
        clearSuggestion();
        setLastAppliedText(null);
        setLastCheckedText("");
        setSuggestionPhase("idle");
        void renderSuggestionIndicator();
        updateIndicatorPosition(activeElement);
        return;
      }

      if (lastAppliedText && latestText !== lastAppliedText.trim()) {
        setLastAppliedText(null);
      }

      if (lastAppliedText && latestText === lastAppliedText.trim()) {
        return;
      }

      setIsSuggestionLoading(true);
      setSuggestionPhase("loading");
      void renderSuggestionIndicator();
      updateIndicatorPosition(activeElement);

      void checkText(latestText).finally(() => {
        if (!isLatestRequest(requestId)) return;

        setIsSuggestionLoading(false);

        if (!activeElement) return;

        const currentText = getElementText(activeElement).trim();

        if (currentText !== latestText) {
          if (!currentText) {
            clearSuggestion();
            setSuggestionPhase("idle");
          } else {
            setSuggestionPhase("typing");
          }

          void renderSuggestionIndicator();
          updateIndicatorPosition(activeElement);
          return;
        }

        setLastCheckedText(latestText);
        setSuggestionPhase("suggesting");
        void renderSuggestionIndicator();
        updateIndicatorPosition(activeElement);
      });
    }, INPUT_DEBOUNCE_MS),
  );
};
