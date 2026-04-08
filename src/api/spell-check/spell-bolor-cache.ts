import { checkWordWithBolor, suggestWithBolor } from "../bolor-spell";
import { applyOriginalCase } from "./spell-case";
import { normalizeWord } from "./spell-text";

const bolorCheckCache = new Map<string, string[]>();
const bolorSuggestCache = new Map<string, string[]>();

export const getBolorCheckResult = async (word: string) => {
  if (bolorCheckCache.has(word)) {
    return bolorCheckCache.get(word) ?? [];
  }

  const result = await checkWordWithBolor(word);
  bolorCheckCache.set(word, result);
  return result;
};

export const getBolorSuggestions = async (word: string) => {
  if (bolorSuggestCache.has(word)) {
    return bolorSuggestCache.get(word) ?? [];
  }

  const result = await suggestWithBolor(word);
  bolorSuggestCache.set(word, result);
  return result;
};

export const isMisspelledWord = async (word: string) => {
  const result = await getBolorCheckResult(word);
  const normalized = normalizeWord(word);

  return result.some((item) => normalizeWord(item) === normalized);
};

export const getWordSuggestions = async (word: string) => {
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
