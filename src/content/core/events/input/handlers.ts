import { updateIndicatorPosition } from "../../../ui";
import { getElementText } from "../../../dom";
import {
  isGoogleDocsSite,
  resetGoogleDocsTextCache,
  syncGoogleDocsTextCache,
} from "../../../dom/google-docs";
import { shouldSkipHandleInput } from "../../guard";
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
  setIndicatorVisualState,
  setIndicatorErrorCount,
} from "../../state";
import { checkText } from "../../checker/request/request";
import { renderSuggestionIndicator } from "../../checker/render";
import { INPUT_DEBOUNCE_MS } from "../../../../lib/constants";

const getInputText = (target: HTMLElement) => {
  if (isGoogleDocsSite()) {
    return syncGoogleDocsTextCache(target).trim();
  }

  return getElementText(target).trim();
};

const resetDocsCacheIfNeeded = () => {
  if (!isGoogleDocsSite()) return;
  resetGoogleDocsTextCache();
};

const renderIdleState = (target: HTMLElement) => {
  clearSuggestion();
  setLastAppliedText(null);
  setLastCheckedText("");
  setSuggestionPhase("idle");
  setIndicatorVisualState("idle");
  setIndicatorErrorCount(0);
  void renderSuggestionIndicator();
  updateIndicatorPosition(target);
};

export const handleInput = () => {
  if (shouldSkipHandleInput() || !activeElement) return;

  updateIndicatorPosition(activeElement);

  const text = getInputText(activeElement);

  if (!text) {
    resetDocsCacheIfNeeded();
    renderIdleState(activeElement);
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

      const latestText = getInputText(activeElement);

      if (!latestText) {
        resetDocsCacheIfNeeded();
        renderIdleState(activeElement);
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

        const currentText = getInputText(activeElement);

        if (currentText !== latestText) {
          if (!currentText) {
            resetDocsCacheIfNeeded();
            clearSuggestion();
            setSuggestionPhase("idle");
            setIndicatorVisualState("idle");
            setIndicatorErrorCount(0);
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
