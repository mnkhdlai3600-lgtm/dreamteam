import { suggestWithBolor } from "./bolor-spell";
import { correctWithOpenAI } from "./openai";

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  mode: "openai-galig" | "bolor-suggest" | "none";
};

const cleanText = (text: string) => {
  return text.trim();
};

const countLatinLetters = (text: string) => {
  const matches = text.match(/[A-Za-z]/g);
  return matches ? matches.length : 0;
};

const countCyrillicLetters = (text: string) => {
  const matches = text.match(/[А-Яа-яӨөҮүЁё]/g);
  return matches ? matches.length : 0;
};

const isSingleWord = (text: string) => {
  const normalized = text.trim();
  return normalized.length > 0 && !/\s/.test(normalized);
};

const isMostlyLatin = (text: string) => {
  const latinCount = countLatinLetters(text);
  const cyrillicCount = countCyrillicLetters(text);

  return latinCount > 0 && latinCount >= cyrillicCount;
};

const isPureSingleCyrillicWord = (text: string) => {
  const normalized = text.trim();
  return /^[А-Яа-яӨөҮүЁё]+$/.test(normalized);
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
    if (isSingleWord(trimmed) && isPureSingleCyrillicWord(trimmed)) {
      const suggestions = await suggestWithBolor(trimmed);
      const corrected = suggestions[0] ?? trimmed;

      return {
        original: text,
        corrected,
        changed: corrected !== trimmed,
        suggestions,
        mode:
          suggestions.length > 0 && corrected !== trimmed
            ? "bolor-suggest"
            : "none",
      };
    }

    if (isMostlyLatin(trimmed)) {
      const corrected = await correctWithOpenAI(trimmed);

      return {
        original: text,
        corrected,
        changed: corrected.trim() !== trimmed,
        suggestions: corrected.trim() !== trimmed ? [corrected] : [],
        mode: corrected.trim() !== trimmed ? "openai-galig" : "none",
      };
    }

    return {
      original: text,
      corrected: text,
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
