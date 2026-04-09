// src/content/core/checker/request/context.ts

import { shouldAutoAdvanceError } from "../../state";
import { parseErrorWords } from "./errors";
import { buildDisplaySuggestions, uniqueSuggestions } from "./utils";
import type { CheckContext, CheckResponseData } from "./types";

const LATIN_RE = /[A-Za-z]/g;
const CYRILLIC_RE = /[А-ЯӨҮЁа-яөүё]/g;

const countMatches = (text: string, regex: RegExp) => {
  return text.match(regex)?.length ?? 0;
};

const getScriptStats = (text: string) => {
  return {
    latinCount: countMatches(text, LATIN_RE),
    cyrillicCount: countMatches(text, CYRILLIC_RE),
  };
};

const isMostlyLatinText = (text: string) => {
  const { latinCount, cyrillicCount } = getScriptStats(text);

  if (!latinCount) return false;
  if (!cyrillicCount) return true;

  return latinCount > cyrillicCount * 1.2;
};

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
  const { latinCount, cyrillicCount } = getScriptStats(trimmed);

  const mode =
    typeof (data as { mode?: unknown }).mode === "string"
      ? ((data as { mode?: string }).mode ?? "")
      : "";

  const isOpenAIGalig = mode === "openai-galig";
  const mostlyLatin = isMostlyLatinText(trimmed);
  const pureLatin = latinCount > 0 && cyrillicCount === 0;

  const shouldTreatAsLatin =
    isOpenAIGalig || pureLatin || (mostlyLatin && rawErrorWords.length === 0);

  const errorWords = shouldTreatAsLatin ? [] : rawErrorWords;

  const displaySuggestions = buildDisplaySuggestions(
    trimmed,
    corrected,
    suggestions,
    shouldTreatAsLatin,
  );

  return {
    trimmed,
    corrected,
    displaySuggestions,
    errorWords,
    isLatinInput: shouldTreatAsLatin,
    hasSentenceCorrection: corrected.length > 0 && corrected !== trimmed,
    hasSuggestions: displaySuggestions.length > 0,
    isAutoAdvancing: shouldAutoAdvanceError,
    justApplied,
  };
};
