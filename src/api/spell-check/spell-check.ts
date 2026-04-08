import { correctWithOpenAI } from "../openai";
import { buildCorrectedSentenceFromCyrillic } from "./spell-cyrillic";
import { cleanText, hasCyrillic, isMostlyLatin } from "./spell-text";
import type { CheckResult } from "./spell-type";

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
    if (isMostlyLatin(trimmed)) {
      const corrected = (await correctWithOpenAI(trimmed)).trim();

      return {
        original: text,
        corrected,
        changed: corrected !== trimmed,
        suggestions: corrected !== trimmed ? [corrected] : [],
        errorWords:
          corrected !== trimmed
            ? [
                {
                  id: "latin-whole-text",
                  word: trimmed,
                  start: 0,
                  end: trimmed.length,
                },
              ]
            : [],
        mode: corrected !== trimmed ? "openai-galig" : "none",
      };
    }

    if (hasCyrillic(trimmed)) {
      return await buildCorrectedSentenceFromCyrillic(trimmed);
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
