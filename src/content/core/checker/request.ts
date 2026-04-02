import { removeIndicator, updateIndicatorPosition } from "../../ui";
import { sendCheckTextMessage } from "../../../lib/chrome";
import {
  activeElement,
  clearSuggestion,
  lastAppliedText,
  resetIndicatorVisualState,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
} from "../state";
import { renderSuggestionIndicator } from "./render";
import {
  clearHighlights,
  highlightErrorWords,
  getElementText,
} from "../../dom";
import { clearHighlightedErrors, setHighlightedErrors } from "../error-state";

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
  isLatinInput: boolean,
) => {
  const trimmedOriginal = original.trim();
  const trimmedCorrected = corrected.trim();

  if (isLatinInput) {
    if (trimmedCorrected && trimmedCorrected !== trimmedOriginal) {
      return [trimmedCorrected];
    }
    return [];
  }

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
    clearHighlightedErrors();
    resetIndicatorVisualState();
    removeIndicator();
    return;
  }

  if (lastAppliedText && trimmed === lastAppliedText.trim()) {
    clearSuggestion();
    clearHighlightedErrors();
    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);

    renderSuggestionIndicator();
    updateIndicatorPosition(activeElement!);

    window.setTimeout(() => {
      resetIndicatorVisualState();
      if (activeElement) {
        renderSuggestionIndicator();
        updateIndicatorPosition(activeElement);
      }
    }, 1200);

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

    const rawErrorWords = Array.isArray(data.errorWords)
      ? data.errorWords
          .filter((item: unknown): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const hasLatin = /[A-Za-z]/.test(trimmed);
    const hasCyrillic = /[А-Яа-яӨөҮүЁё]/.test(trimmed);
    const isLatinInput = hasLatin && !hasCyrillic;

    const errorWords = isLatinInput ? [] : rawErrorWords;

    const displaySuggestions = buildDisplaySuggestions(
      trimmed,
      corrected,
      suggestions,
      isLatinInput,
    );

    const hasSentenceCorrection = corrected.length > 0 && corrected !== trimmed;
    const hasSuggestions = displaySuggestions.length > 0;
    const hasErrors = errorWords.length > 0;

    clearHighlights(activeElement);
    clearHighlightedErrors();

    if (isLatinInput) {
      setIndicatorVisualState("latin");
      setIndicatorErrorCount(0);
    } else if (hasErrors) {
      const items = highlightErrorWords(activeElement, errorWords);
      setHighlightedErrors(items);
      setIndicatorVisualState("error");
      setIndicatorErrorCount(items.length || errorWords.length);
    } else if (hasSentenceCorrection || hasSuggestions) {
      setIndicatorVisualState("success");
      setIndicatorErrorCount(0);
    } else {
      setIndicatorVisualState("idle");
      setIndicatorErrorCount(0);
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
    clearSuggestion();
    clearHighlightedErrors();
    resetIndicatorVisualState();

    if (activeElement) {
      clearHighlights(activeElement);
      renderSuggestionIndicator();
      updateIndicatorPosition(activeElement);
    } else {
      removeIndicator();
    }
  }
};
