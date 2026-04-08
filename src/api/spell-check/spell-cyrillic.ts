import { getWordSuggestions, isMisspelledWord } from "./spell-bolor-cache";
import {
  buildSentenceByReplacingToken,
  getCyrillicWordTokens,
  toErrorItem,
} from "./spell-tokenize";
import type { CheckResult, WordToken } from "./spell-type";

export const buildCorrectedSentenceFromCyrillic = async (
  text: string,
): Promise<CheckResult> => {
  const tokens = getCyrillicWordTokens(text);

  if (!tokens.length) {
    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      errorWords: [],
      mode: "none",
    };
  }

  const errorTokens: WordToken[] = [];

  for (const token of tokens) {
    const originalWord = token.value;

    if (originalWord.length <= 1) continue;

    const misspelled = await isMisspelledWord(originalWord);
    if (!misspelled) continue;

    errorTokens.push(token);
  }

  if (!errorTokens.length) {
    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      errorWords: [],
      mode: "none",
    };
  }

  const errorWords = errorTokens.map((token, index) =>
    toErrorItem(token, index),
  );

  const primaryErrorToken = errorTokens[0];
  const wordSuggestions = await getWordSuggestions(primaryErrorToken.value);
  const bestSuggestion = wordSuggestions[0];

  const corrected = bestSuggestion
    ? buildSentenceByReplacingToken(text, primaryErrorToken, bestSuggestion)
    : text;

  return {
    original: text,
    corrected,
    changed: corrected !== text,
    suggestions: wordSuggestions,
    errorWords,
    mode: wordSuggestions.length > 0 ? "bolor-suggest" : "none",
  };
};
