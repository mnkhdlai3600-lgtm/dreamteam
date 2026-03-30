import { suggestWithBolor } from "./bolor-spell";
import { correctWithOpenAI } from "./openai";

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
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

const bolorCache = new Map<string, string[]>();

const getBolorSuggestions = async (word: string) => {
  if (bolorCache.has(word)) {
    return bolorCache.get(word) ?? [];
  }

  const suggestions = await suggestWithBolor(word);
  bolorCache.set(word, suggestions);
  return suggestions;
};

export const checkText = async (text: string): Promise<CheckResult> => {
  const trimmed = cleanText(text);

  if (!trimmed) {
    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      mode: "none",
    };
  }

  try {
    if (isPureCyrillicWord(trimmed)) {
      const suggestions = await getBolorSuggestions(trimmed);

      if (suggestions.length === 0) {
        return {
          original: text,
          corrected: trimmed,
          changed: false,
          suggestions: [],
          mode: "none",
        };
      }

      const originalNormalized = normalizeWord(trimmed);
      const containsOriginal = suggestions.some(
        (item) => normalizeWord(item) === originalNormalized,
      );

      if (containsOriginal) {
        return {
          original: text,
          corrected: trimmed,
          changed: false,
          suggestions,
          mode: "none",
        };
      }

      const corrected = suggestions[0] ?? trimmed;

      return {
        original: text,
        corrected,
        changed: corrected !== trimmed,
        suggestions,
        mode: corrected !== trimmed ? "bolor-suggest" : "none",
      };
    }

    if (isMostlyLatin(trimmed)) {
      const corrected = (await correctWithOpenAI(trimmed)).trim();

      return {
        original: text,
        corrected,
        changed: corrected !== trimmed,
        suggestions: corrected !== trimmed ? [corrected] : [],
        mode: corrected !== trimmed ? "openai-galig" : "none",
      };
    }

    return {
      original: text,
      corrected: trimmed,
      changed: false,
      suggestions: [],
      mode: "none",
    };
  } catch (error) {
    console.error("checkText failed:", error);

    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      mode: "none",
    };
  }
};
