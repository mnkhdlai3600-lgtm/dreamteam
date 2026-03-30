import { removeIndicator } from "../../ui/indicator";
import { getElementText } from "../../dom/editable";
import { shouldSkipHandleInput } from "../guard";
import {
  activeElement,
  clearSuggestion,
  debounceTimer,
  lastAppliedText,
  lastCheckedText,
  setDebounceTimer,
  setLastCheckedText,
} from "../state";
import { INPUT_DEBOUNCE_MS } from "../../../lib/constants";
import { checkText } from "./request";

export const handleInput = () => {
  if (shouldSkipHandleInput() || !activeElement) return;

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

      setLastCheckedText(latestText);
      void checkText(latestText);
    }, INPUT_DEBOUNCE_MS),
  );
};
