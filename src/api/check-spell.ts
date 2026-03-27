import { suggestWithBolor } from "./bolor-spell";
import { correctWithOpenAI } from "./openai";

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  mode: "openai-galig" | "bolor-suggest" | "openai-then-bolor" | "none";
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

const tokenizeText = (text: string) => {
  return (
    text.match(/[А-Яа-яӨөҮүЁё]+|[A-Za-z]+|\s+|[^\sA-Za-zА-Яа-яӨөҮүЁё]+/g) ?? []
  );
};

const bolorCache = new Map<string, string[]>();

const correctCyrillicTextWithBolor = async (text: string) => {
  const tokens = tokenizeText(text);
  const correctedTokens: string[] = [];
  const allSuggestions: string[] = [];
  let changed = false;

  for (const token of tokens) {
    if (!isPureCyrillicWord(token)) {
      correctedTokens.push(token);
      continue;
    }

    try {
      let suggestions: string[] = [];

      if (bolorCache.has(token)) {
        suggestions = bolorCache.get(token) ?? [];
      } else {
        suggestions = await suggestWithBolor(token);
        bolorCache.set(token, suggestions);
      }

      const best = suggestions[0] ?? token;

      correctedTokens.push(best);
      allSuggestions.push(...suggestions);

      if (best !== token) {
        changed = true;
      }
    } catch {
      correctedTokens.push(token);
    }
  }

  return {
    corrected: correctedTokens.join(""),
    suggestions: allSuggestions,
    changed,
  };
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
      const suggestions = await suggestWithBolor(trimmed);
      const corrected = suggestions[0] ?? trimmed;

      return {
        original: text,
        corrected,
        changed: corrected !== trimmed,
        suggestions,
        mode: suggestions.length > 0 ? "bolor-suggest" : "none",
      };
    }

    let baseText = trimmed;
    let usedOpenAI = false;

    if (isMostlyLatin(trimmed)) {
      baseText = (await correctWithOpenAI(trimmed)).trim();
      usedOpenAI = baseText !== trimmed;
    }

    const bolorResult = await correctCyrillicTextWithBolor(baseText);

    return {
      original: text,
      corrected: bolorResult.corrected,
      changed: bolorResult.corrected !== trimmed,
      suggestions: bolorResult.suggestions,
      mode: bolorResult.changed
        ? usedOpenAI
          ? "openai-then-bolor"
          : "bolor-suggest"
        : usedOpenAI
          ? "openai-galig"
          : "none",
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
