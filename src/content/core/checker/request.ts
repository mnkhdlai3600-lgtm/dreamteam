import { createIndicator, removeIndicator } from "../../ui/indicator";
import { sendCheckTextMessage } from "../../../lib/chrome/runtime";
import {
  activeElement,
  clearSuggestion,
  lastAppliedText,
  nextRequestId,
  requestCounter,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
} from "../state";
import { renderSuggestionIndicator } from "./render";
import { buildDisplaySuggestions, uniqueSuggestions } from "./utils";
import { clearHighlights, highlightErrorWord } from "../../dom/highlight";

export const checkText = async (text: string) => {
  const trimmed = text.trim();

  if (!trimmed) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  if (lastAppliedText && trimmed === lastAppliedText.trim()) {
    clearSuggestion();
    return;
  }

  const currentRequestId = nextRequestId();

  try {
    const response = await sendCheckTextMessage(trimmed);

    if (
      currentRequestId !== requestCounter ||
      !response?.success ||
      !response.data
    ) {
      if (currentRequestId === requestCounter) {
        throw new Error(response?.error || "Check failed");
      }
      return;
    }

    if (!activeElement) return;

    const { data } = response;
    const corrected = (data.corrected || "").trim();
    const suggestions = uniqueSuggestions(
      Array.isArray(data.suggestions) ? data.suggestions : [],
    );
    const errorWords = Array.isArray(data.errorWords) ? data.errorWords : [];

    const { displaySuggestions, hasLatin } = buildDisplaySuggestions(
      trimmed,
      corrected,
      suggestions,
    );

    const hasRealCorrection = corrected.length > 0 && corrected !== trimmed;

    const hasDifferentSuggestions = displaySuggestions.some(
      (item) => item.trim() !== trimmed,
    );

    const shouldSuggest = hasLatin
      ? displaySuggestions.length > 0
      : hasRealCorrection || hasDifferentSuggestions;

    clearHighlights(activeElement);

    if (!shouldSuggest) {
      clearSuggestion();
      removeIndicator();
      return;
    }

    setLatestSuggestions(displaySuggestions);
    setSelectedSuggestionIndex(0);
    setLatestSuggestion(displaySuggestions[0] ?? null);

    const firstErrorWord = errorWords[0]?.trim();

    if (firstErrorWord) {
      highlightErrorWord(activeElement, firstErrorWord);
    }

    renderSuggestionIndicator();
  } catch (error) {
    if (currentRequestId !== requestCounter) return;

    clearSuggestion();

    if (activeElement) {
      clearHighlights(activeElement);

      void createIndicator(
        activeElement,
        error instanceof Error ? error.message : "Холболтын алдаа",
      );
    }
  }
};
