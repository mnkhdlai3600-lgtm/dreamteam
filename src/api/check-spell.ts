import { checkShortTextWithBolor } from "./bolor-spell";
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
  console.log("CHECK TEXT:", trimmed);

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
    console.log("MODE: OPENAI GALIG");
    const corrected = await correctWithOpenAI(trimmed);

    return {
      original: text,
      corrected,
      changed: corrected !== text,
      suggestions: corrected !== text ? [corrected] : [],
      mode: corrected !== text ? "openai-galig" : "none",
    };
  }

  try {
    console.log("MODE: BOLOR SHORT");
    const suggestions = await checkShortTextWithBolor(trimmed);

    if (suggestions.length > 0) {
      const corrected = suggestions[0];

      return {
        original: text,
        corrected,
        changed: corrected !== text,
        suggestions,
        mode: corrected !== text ? "bolor-suggest" : "none",
      };
    }
  } catch (error) {
    console.error("Bolor short check алдаа:", error);
  }

  console.log("MODE: OPENAI FALLBACK");
  const corrected = await correctWithOpenAI(trimmed);

  return {
    original: text,
    corrected,
    changed: corrected !== text,
    suggestions: corrected !== text ? [corrected] : [],
    mode: corrected !== text ? "openai-galig" : "none",
  };
};
