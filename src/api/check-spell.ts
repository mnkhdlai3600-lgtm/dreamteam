import { checkWordWithBolor, suggestWithBolor } from "./bolor-spell";
import { correctWithOpenAI } from "./openai";

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  errorWords: string[];
  mode: "openai-galig" | "bolor-suggest" | "none";
};

const cleanText = (text: string) => text.trim();

const countLatinLetters = (text: string) => {
  const matches = text.match(/[A-Za-z]/g);
  return matches ? matches.length : 0;
};

const countCyrillicLetters = (text: string) => {
  const matches = text.match(/[А-Яа-яӨөҮүЁё]/g);
  return matches ? matches.length : 0;
};

const isMostlyLatin = (text: string) => {
  const latinCount = countLatinLetters(text);
  const cyrillicCount = countCyrillicLetters(text);

  return latinCount > 0 && latinCount >= cyrillicCount;
};

const isPureCyrillicWord = (text: string) => /^[А-Яа-яӨөҮүЁё]+$/.test(text);

const normalizeWord = (text: string) => text.trim().toLowerCase();

const bolorCheckCache = new Map<string, string[]>();
const bolorSuggestCache = new Map<string, string[]>();

const getBolorCheckResult = async (word: string) => {
  if (bolorCheckCache.has(word)) {
    return bolorCheckCache.get(word) ?? [];
  }

  const result = await checkWordWithBolor(word);
  bolorCheckCache.set(word, result);
  return result;
};

const getBolorSuggestions = async (word: string) => {
  if (bolorSuggestCache.has(word)) {
    return bolorSuggestCache.get(word) ?? [];
  }

  const result = await suggestWithBolor(word);
  bolorSuggestCache.set(word, result);
  return result;
};

export const checkText = async (text: string): Promise<CheckResult> => {
  const trimmed = cleanText(text);

  if (!trimmed) {
    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      errorWords: [],
      mode: "none",
    };
  }

  try {
    if (isPureCyrillicWord(trimmed)) {
      const misspelledWords = await getBolorCheckResult(trimmed);
      const originalNormalized = normalizeWord(trimmed);

      const matchedErrorWords = misspelledWords.filter(
        (item) => normalizeWord(item) === originalNormalized,
      );

      const isMisspelled = matchedErrorWords.length > 0;

      if (!isMisspelled) {
        return {
          original: text,
          corrected: trimmed,
          changed: false,
          suggestions: [],
          errorWords: [],
          mode: "none",
        };
      }

      const suggestions = await getBolorSuggestions(trimmed);
      const filteredSuggestions = suggestions.filter(
        (item) => normalizeWord(item) !== originalNormalized,
      );

      const corrected = filteredSuggestions[0] ?? trimmed;

      return {
        original: text,
        corrected,
        changed: corrected !== trimmed,
        suggestions: filteredSuggestions,
        errorWords: [trimmed],
        mode: filteredSuggestions.length > 0 ? "bolor-suggest" : "none",
      };
    }

    if (isMostlyLatin(trimmed)) {
      const corrected = (await correctWithOpenAI(trimmed)).trim();

      return {
        original: text,
        corrected,
        changed: corrected !== trimmed,
        suggestions: corrected !== trimmed ? [corrected] : [],
        errorWords: corrected !== trimmed ? [trimmed] : [],
        mode: corrected !== trimmed ? "openai-galig" : "none",
      };
    }

    return {
      original: text,
      corrected: trimmed,
      changed: false,
      suggestions: [],
      errorWords: [],
      mode: "none",
    };
  } catch (error) {
    console.error("checkText failed:", error);

    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      errorWords: [],
      mode: "none",
    };
  }
};
