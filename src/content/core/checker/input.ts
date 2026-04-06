import { removeIndicator, updateIndicatorPosition } from "../../ui";
import {
  getElementText,
  isGoogleDocsSite,
  resolveActiveEditable,
} from "../../dom";
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

const GOOGLE_DOCS_READ_DELAY_MS = 120;

const clearPendingDebounce = () => {
  if (!debounceTimer) return;
  window.clearTimeout(debounceTimer);
  setDebounceTimer(null);
};

const hasLatinText = (text: string) => /[A-Za-z]/.test(text);

const getVisualStateFromText = (text: string) => {
  return hasLatinText(text) ? "latin" : "idle";
};

const readEditableText = (editable: HTMLElement) => {
  return getElementText(editable).trim();
};

const readEditableTextAsync = async (editable: HTMLElement) => {
  if (!isGoogleDocsSite()) {
    return readEditableText(editable);
  }

  await new Promise((resolve) =>
    window.setTimeout(resolve, GOOGLE_DOCS_READ_DELAY_MS),
  );

  return readEditableText(editable);
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
  console.log("[болор][handleInput-start]");

  if (shouldSkipHandleInput()) {
    console.log("[болор][handleInput-skip]");
    return;
  }

  const currentEditable = resolveActiveEditable() ?? activeElement;
  console.log("[болор][handleInput-editable]", currentEditable);

  if (!currentEditable) return;

  setActiveElement(currentEditable);
  updateIndicatorPosition(currentEditable);

  void (async () => {
    const text = await readEditableTextAsync(currentEditable);
    console.log("[болор][handleInput-text]", text);

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
      console.log("[болор][handleInput-same-text]");
      return;
    }

    clearPendingDebounce();

    setDebounceTimer(
      window.setTimeout(() => {
        void (async () => {
          console.log("[болор][debounce-fire]");

          if (shouldSkipHandleInput()) return;

          const latestEditable = resolveActiveEditable() ?? activeElement;
          console.log("[болор][latest-editable]", latestEditable);

          if (!latestEditable) return;

          setActiveElement(latestEditable);

          const latestText = await readEditableTextAsync(latestEditable);
          console.log("[болор][latest-text]", latestText);

          if (!latestText) {
            resetEmptyState(latestEditable);
            return;
          }

          if (
            (lastAppliedText && latestText === lastAppliedText.trim()) ||
            latestText === lastCheckedText
          ) {
            console.log("[болор][latest-same-text]");
            return;
          }

          setIndicatorVisualState(getVisualStateFromText(latestText));
          setIsSuggestionLoading(true);
          setSuggestionPhase("loading");
          setLastCheckedText(latestText);
          renderSuggestionIndicator();
          updateIndicatorPosition(latestEditable);

          console.log("[болор][before-checkText]", latestText);

          void checkText(latestText).finally(async () => {
            const liveEditable = resolveActiveEditable() ?? activeElement;
            console.log("[болор][after-checkText-liveEditable]", liveEditable);

            if (!liveEditable) {
              removeIndicator();
              return;
            }

            const currentText = await readEditableTextAsync(liveEditable);
            console.log("[болор][after-checkText-currentText]", currentText);

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
        })();
      }, INPUT_DEBOUNCE_MS),
    );
  })();
};
