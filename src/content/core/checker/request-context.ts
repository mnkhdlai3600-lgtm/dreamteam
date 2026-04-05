import { shouldAutoAdvanceError } from "../state";
import { parseErrorWords } from "./request-errors";
import { buildDisplaySuggestions, uniqueSuggestions } from "./request-utils";
import type { CheckContext, CheckResponseData } from "./request-types";

const hasLatinText = (text: string) => /[A-Za-z]/.test(text);

const parseSuggestions = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return uniqueSuggestions(
    value.filter((item: unknown): item is string => typeof item === "string"),
  );
};

export const buildCheckContext = (
  trimmed: string,
  data: CheckResponseData,
  justApplied: boolean,
): CheckContext => {
  const corrected =
    typeof data.corrected === "string" ? data.corrected.trim() : "";

  const suggestions = parseSuggestions(data.suggestions);
  const rawErrorWords = parseErrorWords(data.errorWords, trimmed);

  const isLatinInput = hasLatinText(trimmed);
  const errorWords = isLatinInput ? [] : rawErrorWords;

  const displaySuggestions = buildDisplaySuggestions(
    trimmed,
    corrected,
    suggestions,
    isLatinInput,
  );

  return {
    trimmed,
    corrected,
    displaySuggestions,
    errorWords,
    isLatinInput,
    hasSentenceCorrection: corrected.length > 0 && corrected !== trimmed,
    hasSuggestions: displaySuggestions.length > 0,
    isAutoAdvancing: shouldAutoAdvanceError,
    justApplied,
  };
};
