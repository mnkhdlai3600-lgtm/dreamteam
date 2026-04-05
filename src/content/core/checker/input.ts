import { removeIndicator, updateIndicatorPosition } from "../../ui";
import { getElementText, resolveActiveEditable } from "../../dom";
import { shouldSkipHandleInput } from "../guard";
import {
  activeElement,
  cancelPendingRequests,
  clearSuggestion,
  debounceTimer,
  lastAppliedText,
  lastCheckedText,
  resetIndicatorVisualState,
  setActiveElement,
  setDebounceTimer,
  setIndicatorVisualState,
  setIsSuggestionLoading,
  setLastCheckedText,
  setSuggestionPhase,
} from "../state";
import { checkText } from "./request";
import { renderSuggestionIndicator } from "./render";
import { INPUT_DEBOUNCE_MS } from "../../../lib/constants";

const clearPendingDebounce = () => {
  if (!debounceTimer) return;
  window.clearTimeout(debounceTimer);
  setDebounceTimer(null);
};

const hasLatinText = (text: string) => /[A-Za-z]/.test(text);

const getVisualStateFromText = (text: string) => {
  return hasLatinText(text) ? "latin" : "idle";
};

const resetEmptyState = (editable: HTMLElement) => {
  clearPendingDebounce();
  cancelPendingRequests();
  setIsSuggestionLoading(false);
  clearSuggestion();
  resetIndicatorVisualState();
  setSuggestionPhase("idle");
  renderSuggestionIndicator();
  updateIndicatorPosition(editable);
};

export const handleInput = () => {
  if (shouldSkipHandleInput()) return;

  const currentEditable = resolveActiveEditable() ?? activeElement;
  if (!currentEditable) return;

  setActiveElement(currentEditable);
  updateIndicatorPosition(currentEditable);

  const text = getElementText(currentEditable).trim();

  if (!text) {
    resetEmptyState(currentEditable);
    return;
  }

  setIndicatorVisualState(getVisualStateFromText(text));
  setSuggestionPhase("typing");
  renderSuggestionIndicator();
  updateIndicatorPosition(currentEditable);

  if (
    (lastAppliedText && text === lastAppliedText.trim()) ||
    text === lastCheckedText
  ) {
    return;
  }

  clearPendingDebounce();

  setDebounceTimer(
    window.setTimeout(() => {
      if (shouldSkipHandleInput()) return;

      const latestEditable = resolveActiveEditable() ?? activeElement;
      if (!latestEditable) return;

      setActiveElement(latestEditable);

      const latestText = getElementText(latestEditable).trim();

      if (!latestText) {
        resetEmptyState(latestEditable);
        return;
      }

      if (
        (lastAppliedText && latestText === lastAppliedText.trim()) ||
        latestText === lastCheckedText
      ) {
        return;
      }

      setIndicatorVisualState(getVisualStateFromText(latestText));
      setIsSuggestionLoading(true);
      setSuggestionPhase("loading");
      setLastCheckedText(latestText);
      renderSuggestionIndicator();
      updateIndicatorPosition(latestEditable);

      void checkText(latestText).finally(() => {
        const liveEditable = resolveActiveEditable() ?? activeElement;

        if (!liveEditable) {
          removeIndicator();
          return;
        }

        const currentText = getElementText(liveEditable).trim();

        if (!currentText) {
          clearSuggestion();
          resetIndicatorVisualState();
          setSuggestionPhase("idle");
          renderSuggestionIndicator();
          updateIndicatorPosition(liveEditable);
          return;
        }

        setIsSuggestionLoading(false);
        renderSuggestionIndicator();
        updateIndicatorPosition(liveEditable);
      });
    }, INPUT_DEBOUNCE_MS),
  );
};
