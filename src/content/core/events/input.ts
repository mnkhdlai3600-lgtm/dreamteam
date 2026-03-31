import { removeIndicator } from "../../ui/indicator";
import {
  getEventEditableTarget,
  getElementText,
  isMessengerSite,
} from "../../dom/editable";
import { shouldSkipHandleInput } from "../guard";
import {
  activeElement,
  clearSuggestion,
  debounceTimer,
  lastAppliedText,
  lastCheckedText,
  setActiveElement,
  setDebounceTimer,
  setIsSuggestionLoading,
  setLastCheckedText,
} from "../state";

import { checkText } from "../checker/request";
import { renderSuggestionIndicator } from "../checker/render";
import { updateIndicatorPosition } from "../../ui/indicator-render";
import { INPUT_DEBOUNCE_MS } from "../../constants";

const ignoredKey = (event: KeyboardEvent) => {
  if (event.altKey && event.code === "Space") return true;

  return (
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.key === "Enter" ||
    event.key === "Escape"
  );
};

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

  if (debounceTimer) window.clearTimeout(debounceTimer);

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

        if (activeElement) {
          renderSuggestionIndicator();
          updateIndicatorPosition(activeElement);
        }
      });
    }, INPUT_DEBOUNCE_MS),
  );
};

export const registerInputEvents = () => {
  document.addEventListener(
    "input",
    (event) => {
      if (shouldSkipHandleInput()) return;

      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);
      updateIndicatorPosition(target);
      handleInput();
    },
    true,
  );

  document.addEventListener(
    "keyup",
    (event) => {
      if (isMessengerSite() || shouldSkipHandleInput()) return;

      const keyboardEvent = event as KeyboardEvent;
      if (ignoredKey(keyboardEvent)) return;

      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);
      updateIndicatorPosition(target);
      handleInput();
    },
    true,
  );

  document.addEventListener(
    "selectionchange",
    () => {
      if (!activeElement) return;
      updateIndicatorPosition(activeElement);
    },
    true,
  );
};
