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

const hasCyrillic = (text: string) => /[А-Яа-яӨөҮүЁё]/.test(text);

const isMostlyLatin = (text: string) => {
  const latinCount = countLatinLetters(text);
  const cyrillicCount = countCyrillicLetters(text);

  return latinCount > 0 && latinCount >= cyrillicCount;
};

const normalizeWord = (text: string) => text.trim().toLowerCase();

const isAllUpperCase = (text: string) => /^[А-ЯӨҮЁ]+$/.test(text.trim());

const isTitleCase = (text: string) => /^[А-ЯӨҮЁ][а-яөүё]+$/.test(text.trim());

const applyOriginalCase = (original: string, suggestion: string) => {
  const trimmed = suggestion.trim();
  if (!trimmed) return suggestion;

  if (isAllUpperCase(original)) {
    return trimmed.toUpperCase();
  }

  if (isTitleCase(original)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  return trimmed;
};

type WordToken = {
  value: string;
  start: number;
  end: number;
};

const getCyrillicWordTokens = (text: string): WordToken[] => {
  const tokens: WordToken[] = [];
  const regex = /[А-Яа-яӨөҮүЁё]+/g;

  let match: RegExpExecArray | null = regex.exec(text);

  while (match) {
    tokens.push({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });

    match = regex.exec(text);
  }

  return tokens;
};

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

const isMisspelledWord = async (word: string) => {
  const result = await getBolorCheckResult(word);
  const normalized = normalizeWord(word);

  return result.some((item) => normalizeWord(item) === normalized);
};

const getWordSuggestions = async (word: string) => {
  const suggestions = await getBolorSuggestions(word);
  const normalized = normalizeWord(word);

  const filtered = suggestions.filter(
    (item) => normalizeWord(item) !== normalized,
  );

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of filtered) {
    const value = item.trim();
    if (!value) continue;

    const cased = applyOriginalCase(word, value);
    const key = cased.toLowerCase();

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cased);
  }

  return result;
};

const buildSentenceByReplacingToken = (
  text: string,
  token: WordToken,
  replacement: string,
) => {
  return text.slice(0, token.start) + replacement + text.slice(token.end);
};

const buildCorrectedSentenceFromCyrillic = async (
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

  for (const token of tokens) {
    const originalWord = token.value;

    if (originalWord.length <= 1) {
      continue;
    }

    const misspelled = await isMisspelledWord(originalWord);

    if (!misspelled) {
      continue;
    }

    const wordSuggestions = await getWordSuggestions(originalWord);
    const bestSuggestion = wordSuggestions[0];

    const corrected = bestSuggestion
      ? buildSentenceByReplacingToken(text, token, bestSuggestion)
      : text;

    return {
      original: text,
      corrected,
      changed: corrected !== text,
      suggestions: wordSuggestions,
      errorWords: [originalWord],
      mode: wordSuggestions.length > 0 ? "bolor-suggest" : "none",
    };
  }

  return {
    original: text,
    corrected: text,
    changed: false,
    suggestions: [],
    errorWords: [],
    mode: "none",
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
        errorWords: corrected !== trimmed ? [trimmed] : [],
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
