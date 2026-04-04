import { sendCheckTextMessage } from "../../../lib/chrome";
import { buildDisplaySuggestions, uniqueSuggestions } from "./request-utils";
import type { SingleWordSuggestResult } from "./request-types";

export const requestSuggestionsForWord = async (
  word: string,
): Promise<SingleWordSuggestResult> => {
  const trimmed = word.trim();

  if (!trimmed) {
    return {
      suggestions: [],
      corrected: null,
    };
  }

  const response = await sendCheckTextMessage(trimmed);

  if (!response?.success || !response.data) {
    throw new Error(response?.error || "Үгийн санал авахад алдаа гарлаа");
  }

  const corrected =
    typeof response.data.corrected === "string"
      ? response.data.corrected.trim()
      : "";

  const suggestions = uniqueSuggestions(
    Array.isArray(response.data.suggestions)
      ? response.data.suggestions.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [],
  );

  const displaySuggestions = buildDisplaySuggestions(
    trimmed,
    corrected,
    suggestions,
    false,
  );

  return {
    suggestions: displaySuggestions,
    corrected: corrected || null,
  };
};
