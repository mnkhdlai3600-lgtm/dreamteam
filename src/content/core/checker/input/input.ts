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
  setActiveElement,
  setDebounceTimer,
  setIndicatorVisualState,
  setIsSuggestionLoading,
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

export const handleInput = (event?: Event) => {
  if (shouldSkipHandleInput()) return;

  const currentEditable = resolveActiveEditable() ?? activeElement;
  if (!currentEditable) return;

  const preferCache = shouldPreferDocsCache(event);

  if (isGoogleDocsSite() && !preferCache) {
    scheduleGoogleDocsTextResync(currentEditable);
  }

  setActiveElement(currentEditable);
  updateIndicatorPosition(currentEditable);

  void (async () => {
    const text = await readEditableTextAsync(currentEditable, preferCache);
    updateDocsCacheIfNeeded(text);

    if (!text) {
      resetEmptyState(currentEditable);
      return;
    }

    if (shouldResetDocsSuggestionState(text)) {
      resetDocsSuggestionState(currentEditable, text);
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

          const latestPreferCache = shouldPreferDocsCache(event);

          if (isGoogleDocsSite() && !latestPreferCache) {
            scheduleGoogleDocsTextResync(latestEditable);
          }

          setActiveElement(latestEditable);

          const latestText = await readEditableTextAsync(
            latestEditable,
            latestPreferCache,
          );
          updateDocsCacheIfNeeded(latestText);

          if (!latestText) {
            resetEmptyState(latestEditable);
            return;
          }

          if (shouldResetDocsSuggestionState(latestText)) {
            resetDocsSuggestionState(latestEditable, latestText);
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

            const currentText = await readEditableTextAsync(
              liveEditable,
              false,
            );
            updateDocsCacheIfNeeded(currentText);

            if (!currentText) {
              if (isGoogleDocsSite()) {
                setIsSuggestionLoading(false);
                renderSuggestionIndicator();
                updateIndicatorPosition(liveEditable);
                return;
              }

              cancelPendingRequests();
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
          });
        })();
      }, INPUT_DEBOUNCE_MS),
    );
  })();
};
