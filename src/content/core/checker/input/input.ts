// src/content/core/checker/input/input.ts

import { removeIndicator, updateIndicatorPosition } from "../../../ui";
import { resolveActiveEditable } from "../../../dom";
import {
  isGoogleDocsSite,
  scheduleGoogleDocsTextResync,
} from "../../../dom/google-docs";
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
import { checkText } from "../request/request";
import { renderSuggestionIndicator } from "../render";
import { INPUT_DEBOUNCE_MS } from "../../../../lib/constants";
import { clearPendingDebounce } from "../input/input-debounce";
import {
  getVisualStateFromText,
  shouldResetDocsSuggestionState,
  shouldSkipSameTextCheck,
} from "../input/input-compare";
import {
  resetDocsSuggestionState,
  resetEmptyState,
} from "../input/input-reset";
import {
  shouldPreferDocsCache,
  updateDocsCacheIfNeeded,
} from "../input/input-cache";
import { readEditableTextAsync } from "../input/input-read";
import {
  getRecentPasteLikeInputType,
  wasRecentPasteLikeInput,
} from "../../events/input/bind";

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

<<<<<<< HEAD
  const docsSite = isGoogleDocsSite();
  const preferCache = docsSite ? true : shouldPreferDocsCache(event);
=======
  const preferCache = shouldPreferDocsCache(event);
  const useFullTextCheck = shouldUseFullTextCheck(event);

  if (isGoogleDocsSite() && !preferCache) {
    scheduleGoogleDocsTextResync(currentEditable);
  }
>>>>>>> temp-fix

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
          const latestPreferCache = latestDocsSite
            ? true
            : shouldPreferDocsCache(event);

          setActiveElement(latestEditable);

          const latestText = await readEditableTextAsync(
            latestEditable,
            latestPreferCache,
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

<<<<<<< HEAD
          console.log("[docs-debug] call-checkText", { latestText });

          void checkText(latestText).finally(async () => {
            if (!isLatestRequest(requestId)) return;

=======
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
>>>>>>> temp-fix
            const liveEditable = resolveActiveEditable() ?? activeElement;
            if (!liveEditable) {
              removeIndicator();
              return;
            }

            setActiveElement(liveEditable);

            const currentText = await readEditableTextAsync(
              liveEditable,
              isGoogleDocsSite(),
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
      }, INPUT_DEBOUNCE_MS),
    );
  })();
};
