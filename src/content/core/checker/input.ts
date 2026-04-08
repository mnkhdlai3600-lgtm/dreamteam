import { removeIndicator, updateIndicatorPosition } from "../../ui";
import {
  getElementText,
  isGoogleDocsSite,
  resolveActiveEditable,
} from "../../dom";
import { setGoogleDocsTextCache } from "../../dom/google-docs";
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

const updateDocsCacheIfNeeded = (text: string) => {
  if (!isGoogleDocsSite()) return;
  setGoogleDocsTextCache(text);
};

const shouldSkipSameTextCheck = (text: string) => {
  if (!text) return true;

  if (lastAppliedText && text === lastAppliedText.trim()) {
    return true;
  }

  if (!isGoogleDocsSite() && text === lastCheckedText) {
    return true;
  }

  return false;
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

  void (async () => {
    const text = await readEditableTextAsync(currentEditable);
    updateDocsCacheIfNeeded(text);

    if (!text) {
      resetEmptyState(currentEditable);
      return;
    }

    setIndicatorVisualState(getVisualStateFromText(text));
    setSuggestionPhase("typing");
    renderSuggestionIndicator();
    updateIndicatorPosition(currentEditable);

    if (shouldSkipSameTextCheck(text)) {
      return;
    }

    clearPendingDebounce();

    setDebounceTimer(
      window.setTimeout(() => {
        void (async () => {
          if (shouldSkipHandleInput()) return;

          const latestEditable = resolveActiveEditable() ?? activeElement;
          if (!latestEditable) return;

          setActiveElement(latestEditable);

          const latestText = await readEditableTextAsync(latestEditable);
          updateDocsCacheIfNeeded(latestText);

          if (!latestText) {
            resetEmptyState(latestEditable);
            return;
          }

          if (shouldSkipSameTextCheck(latestText)) {
            return;
          }

          setIndicatorVisualState(getVisualStateFromText(latestText));
          setIsSuggestionLoading(true);
          setSuggestionPhase("loading");
          renderSuggestionIndicator();
          updateIndicatorPosition(latestEditable);

          void checkText(latestText).finally(async () => {
            const liveEditable = resolveActiveEditable() ?? activeElement;
            if (!liveEditable) {
              removeIndicator();
              return;
            }

            setActiveElement(liveEditable);

            const currentText = await readEditableTextAsync(liveEditable);
            updateDocsCacheIfNeeded(currentText);

            if (!currentText) {
              if (isGoogleDocsSite()) {
                setIsSuggestionLoading(false);
                renderSuggestionIndicator();
                updateIndicatorPosition(liveEditable);
                return;
              }

              clearSuggestion();
              resetIndicatorVisualState();
              setSuggestionPhase("idle");
              setIsSuggestionLoading(false);
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
