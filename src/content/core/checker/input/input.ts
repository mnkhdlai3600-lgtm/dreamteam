// src/content/core/checker/input/input.ts

import { INPUT_DEBOUNCE_MS } from "../../../../lib/constants";
import { resolveActiveEditable } from "../../../dom";
import {
  isGoogleDocsSite,
  scheduleGoogleDocsTextResync,
} from "../../../dom/google-docs";
import { removeIndicator, updateIndicatorPosition } from "../../../ui";
import {
  getRecentPasteLikeInputType,
  wasRecentPasteLikeInput,
} from "../../events/input/bind";
import { shouldSkipHandleInput } from "../../guard";
import {
  activeElement,
  cancelPendingRequests,
  isLatestRequest,
  lastAppliedText,
  lastCheckedText,
  nextRequestId,
  pauseDocsSuggestionUntilInput,
  setActiveElement,
  setDebounceTimer,
  setIndicatorVisualState,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckedText,
  setPauseDocsSuggestionUntilInput,
  setSuggestionPhase,
} from "../../state";
import {
  shouldPreferDocsCache,
  updateDocsCacheIfNeeded,
} from "../input/input-cache";
import {
  getVisualStateFromText,
  shouldResetDocsSuggestionState,
  shouldSkipSameTextCheck,
} from "../input/input-compare";
import { clearPendingDebounce } from "../input/input-debounce";
import { readEditableTextAsync } from "../input/input-read";
import {
  resetDocsSuggestionState,
  resetEmptyState,
} from "../input/input-reset";
import { renderSuggestionIndicator } from "../render";
import { checkText } from "../request/request";

const shouldUseFullTextCheck = (event?: Event) => {
  const inputType =
    event &&
    "inputType" in event &&
    typeof (event as InputEvent).inputType === "string"
      ? (event as InputEvent).inputType
      : "";

  if (
    inputType === "insertFromPaste" ||
    inputType === "insertFromDrop" ||
    inputType === "insertFromYank" ||
    inputType === "historyUndo" ||
    inputType === "historyRedo"
  ) {
    return true;
  }

  return wasRecentPasteLikeInput();
};

export const handleInput = (event?: Event) => {
  if (shouldSkipHandleInput()) return;

  const currentEditable = resolveActiveEditable() ?? activeElement;
  if (!currentEditable) return;

  const docsSite = isGoogleDocsSite();
  const preferCache = shouldPreferDocsCache(event);
  const useFullTextCheck = shouldUseFullTextCheck(event);

  if (docsSite && !preferCache) {
    scheduleGoogleDocsTextResync(currentEditable);
  }

  setActiveElement(currentEditable);
  updateIndicatorPosition(currentEditable);

  console.log("[docs-debug] start", {
    currentEditable,
    docsSite,
    preferCache,
  });

  void (async () => {
    const text = await readEditableTextAsync(currentEditable, preferCache);

    console.log("[docs-debug] first-text", { text });

    updateDocsCacheIfNeeded(text);

    if (!text) {
      console.log("[docs-debug] exit-empty-first");
      resetEmptyState(currentEditable);
      return;
    }

    if (docsSite && pauseDocsSuggestionUntilInput) {
      const applied = (lastAppliedText ?? "").trim();
      const current = text.trim();

      if (applied && current === applied) {
        setSuggestionPhase("idle");
        setIsSuggestionLoading(false);
        renderSuggestionIndicator();
        updateIndicatorPosition(currentEditable);
        return;
      }

      setPauseDocsSuggestionUntilInput(false);
      setLastAppliedText(null);
      setLastCheckedText("");
      clearPendingDebounce();
      cancelPendingRequests();
    }

    if (shouldResetDocsSuggestionState(text)) {
      console.log("[docs-debug] exit-reset-first", { text });
      resetDocsSuggestionState(currentEditable, text);
      return;
    }

    setIndicatorVisualState(getVisualStateFromText(text));
    setSuggestionPhase("typing");
    renderSuggestionIndicator();
    updateIndicatorPosition(currentEditable);

    if (shouldSkipSameTextCheck(text)) {
      console.log("[docs-debug] exit-skip-first", {
        text,
        lastCheckedText,
        lastAppliedText,
      });
      return;
    }

    clearPendingDebounce();
    cancelPendingRequests();
    const requestId = nextRequestId();

    setDebounceTimer(
      window.setTimeout(() => {
        void (async () => {
          if (!isLatestRequest(requestId)) return;
          if (shouldSkipHandleInput()) return;

          const latestEditable = resolveActiveEditable() ?? activeElement;
          if (!latestEditable) return;

          const latestDocsSite = isGoogleDocsSite();
          const latestPreferCache = shouldPreferDocsCache(event);

          if (latestDocsSite && !latestPreferCache) {
            scheduleGoogleDocsTextResync(latestEditable);
          }

          setActiveElement(latestEditable);

          const latestText = await readEditableTextAsync(
            latestEditable,
            latestPreferCache
          );

          console.log("[docs-debug] debounce-text", { latestText });

          if (!isLatestRequest(requestId)) return;

          updateDocsCacheIfNeeded(latestText);

          if (!latestText) {
            console.log("[docs-debug] exit-empty-debounce");
            resetEmptyState(latestEditable);
            return;
          }

          if (shouldResetDocsSuggestionState(latestText)) {
            console.log("[docs-debug] exit-reset-debounce", { latestText });
            resetDocsSuggestionState(latestEditable, latestText);
            return;
          }

          if (shouldSkipSameTextCheck(latestText)) {
            console.log("[docs-debug] exit-skip-debounce", {
              latestText,
              lastCheckedText,
              lastAppliedText,
            });
            return;
          }

          setIndicatorVisualState(getVisualStateFromText(latestText));
          setIsSuggestionLoading(true);
          setSuggestionPhase("loading");
          renderSuggestionIndicator();
          updateIndicatorPosition(latestEditable);

          console.log("[болор][input-check]", {
            eventType: event?.type,
            inputType:
              event && "inputType" in event
                ? (event as InputEvent).inputType
                : "",
            recentPasteLikeInputType: getRecentPasteLikeInputType(),
            useFullTextCheck,
            latestText,
          });

          void checkText(latestText, {
            useFullText: useFullTextCheck,
          }).finally(async () => {
            const liveEditable = resolveActiveEditable() ?? activeElement;
            if (!liveEditable) {
              removeIndicator();
              return;
            }

            setActiveElement(liveEditable);

            const currentText = await readEditableTextAsync(
              liveEditable,
              isGoogleDocsSite()
            );

            if (!isLatestRequest(requestId)) return;

            updateDocsCacheIfNeeded(currentText);

            if (!currentText) {
              resetEmptyState(liveEditable);
              return;
            }

            if (
              isGoogleDocsSite() &&
              shouldResetDocsSuggestionState(currentText)
            ) {
              resetDocsSuggestionState(liveEditable, currentText);
              return;
            }

            setIsSuggestionLoading(false);
            renderSuggestionIndicator();
            updateIndicatorPosition(liveEditable);

            if (isGoogleDocsSite()) {
              scheduleGoogleDocsTextResync(liveEditable);
            }
          });
        })();
      }, INPUT_DEBOUNCE_MS)
    );
  })();
};
