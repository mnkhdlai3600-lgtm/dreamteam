import { removeIndicator, updateIndicatorPosition } from "../../ui";
import { sendCheckTextMessage } from "../../../lib/chrome";
import {
  activeElement,
  clearSuggestion,
  lastAppliedText,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
} from "../state";
import { renderSuggestionIndicator } from "./render";
import { clearHighlights, highlightErrorWord, getElementText } from "../../dom";

const uniqueSuggestions = (items: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const value = item.trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
  }

  return result;
};

const buildDisplaySuggestions = (
  original: string,
  corrected: string,
  suggestions: string[],
) => {
  const trimmedOriginal = original.trim();
  const trimmedCorrected = corrected.trim();

  const result: string[] = [];

  if (trimmedCorrected && trimmedCorrected !== trimmedOriginal) {
    result.push(trimmedCorrected);
  }

  for (const suggestion of suggestions) {
    const value = suggestion.trim();
    if (!value) continue;
    if (value === trimmedOriginal) continue;
    result.push(value);
  }

  return uniqueSuggestions(result);
};

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

  try {
    const response = await sendCheckTextMessage(trimmed);

    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Шалгалт амжилтгүй");
    }

    if (!activeElement) return;

    const currentElementText = getElementText(activeElement).trim();

    if (!currentElementText || currentElementText !== trimmed) {
      return;
    }

    const { data } = response;

    const corrected =
      typeof data.corrected === "string" ? data.corrected.trim() : "";

    const suggestions = uniqueSuggestions(
      Array.isArray(data.suggestions)
        ? data.suggestions.filter(
            (item: unknown): item is string => typeof item === "string",
          )
        : [],
    );

    const errorWords = Array.isArray(data.errorWords)
      ? data.errorWords
          .filter((item: unknown): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const displaySuggestions = buildDisplaySuggestions(
      trimmed,
      corrected,
      suggestions,
    );

    const hasSentenceCorrection = corrected.length > 0 && corrected !== trimmed;

    const hasSuggestions = displaySuggestions.length > 0;
    const hasErrors = errorWords.length > 0;

    clearHighlights(activeElement);

    if (!hasSentenceCorrection && !hasSuggestions && !hasErrors) {
      clearSuggestion();
      renderSuggestionIndicator();
      updateIndicatorPosition(activeElement);
      return;
    }

    const firstErrorWord = errorWords[0];

    if (firstErrorWord) {
      highlightErrorWord(activeElement, firstErrorWord);
    }

    if (hasSuggestions) {
      setLatestSuggestions(displaySuggestions);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(displaySuggestions[0] ?? null);
    } else if (hasSentenceCorrection) {
      setLatestSuggestions([corrected]);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(corrected);
    } else {
      clearSuggestion();
    }

    renderSuggestionIndicator();
    updateIndicatorPosition(activeElement);
  } catch (error) {
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
