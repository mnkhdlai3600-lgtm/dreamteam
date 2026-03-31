import { removeIndicator } from "../../ui/indicator";
import { sendCheckTextMessage } from "../../../lib/chrome/runtime";
import {
  activeElement,
  clearSuggestion,
  isLatestRequest,
  lastAppliedText,
  nextRequestId,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
} from "../state";
import { renderSuggestionIndicator } from "./render";
import { buildDisplaySuggestions, uniqueSuggestions } from "./utils";
import { clearHighlights, highlightErrorWord } from "../../dom/highlight";
import { getElementText } from "../../dom/editable";
import { updateIndicatorPosition } from "../../ui/indicator-render";

export const checkText = async (text: string) => {
  const trimmed = text.trim();

  if (!trimmed) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  if (lastAppliedText && trimmed === lastAppliedText.trim()) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  const currentRequestId = nextRequestId();

  try {
    const response = await sendCheckTextMessage(trimmed);

    if (!isLatestRequest(currentRequestId)) {
      return;
    }

    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Check failed");
    }

    if (!activeElement) return;

    const currentElementText = getElementText(activeElement).trim();

    if (!currentElementText || currentElementText !== trimmed) {
      return;
    }

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
      renderSuggestionIndicator();
      updateIndicatorPosition(activeElement);
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
    updateIndicatorPosition(activeElement);
  } catch (error) {
    if (!isLatestRequest(currentRequestId)) return;

    console.error("checkText error:", error);
    clearSuggestion();

    if (activeElement) {
      clearHighlights(activeElement);
      renderSuggestionIndicator();
      updateIndicatorPosition(activeElement);
    } else {
      removeIndicator();
    }
  }
};
