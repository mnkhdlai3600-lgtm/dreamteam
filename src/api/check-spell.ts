import { getBolorSpellSuggestions } from "./bolor-spell";
import { correctWithOpenAI } from "./openai";

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  mode: "openai-galig" | "bolor-suggest" | "none";
};

const looksLikeLatinMongolian = (text: string) => {
  const hasLatin = /[a-z]/i.test(text);
  const hasCyrillic = /[а-яөүң]/i.test(text);

  return hasLatin && !hasCyrillic;
};

export const checkText = async (text: string): Promise<CheckResult> => {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      mode: "none",
    };
  }

  if (looksLikeLatinMongolian(trimmed)) {
    const corrected = await correctWithOpenAI(trimmed);

    return {
      original: text,
      corrected,
      changed: corrected !== text,
      suggestions: corrected !== text ? [corrected] : [],
      mode: corrected !== text ? "openai-galig" : "none",
    };
  }

  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1];

  const suggestions = await getBolorSpellSuggestions(lastWord);

  if (suggestions.length > 0) {
    const correctedWords = [...words];
    correctedWords[correctedWords.length - 1] = suggestions[0];
    const corrected = correctedWords.join(" ");

    return {
      original: text,
      corrected,
      changed: corrected !== text,
      suggestions,
      mode: corrected !== text ? "bolor-suggest" : "none",
    };
  }

  const corrected = await correctWithOpenAI(trimmed);

  return {
    original: text,
    corrected,
    changed: corrected !== text,
    suggestions: corrected !== text ? [corrected] : [],
    mode: corrected !== text ? "openai-galig" : "none",
  };
};
