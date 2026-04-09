// src/content/core/checker/apply/apply-utils.ts

export const hasLatinText = (text: string) => /[A-Za-z]/.test(text);

type TextRange = {
  start: number;
  end: number;
  text: string;
};

const LATIN_CHAR_RE = /[A-Za-z]/;
const CYRILLIC_CHAR_RE = /[А-ЯӨҮЁа-яөүё]/;
const LETTER_CHAR_RE = /[A-Za-zА-ЯӨҮЁа-яөүё]/;
const TRAILING_LATIN_ALLOWED_RE = /[A-Za-z\s'"-]/;
const SENTENCE_BREAK_RE = /[.!?。\n\r]+/g;
const INLINE_SPACE_RE = /[ \t\u00A0]/;
const SENTENCE_END_CHAR_RE = /[.!?]/;

const trimSentenceEnd = (text: string) => {
  let end = text.length;

  while (end > 0 && /\s/.test(text[end - 1] ?? "")) {
    end -= 1;
  }

  while (end > 0 && /[.,!?;:]/.test(text[end - 1] ?? "")) {
    end -= 1;
  }

  while (end > 0 && /\s/.test(text[end - 1] ?? "")) {
    end -= 1;
  }

  return end;
};

const getPreviousMeaningfulChar = (text: string, start: number) => {
  let index = start - 1;

  while (index >= 0) {
    const ch = text[index] ?? "";

    if (INLINE_SPACE_RE.test(ch)) {
      index -= 1;
      continue;
    }

    return ch;
  }

  return "";
};

const shouldCapitalizeReplacement = (text: string, start: number) => {
  const previous = getPreviousMeaningfulChar(text, start);

  return (
    !previous ||
    previous === "." ||
    previous === "!" ||
    previous === "?" ||
    previous === "\n" ||
    previous === "\r"
  );
};

const capitalizeFirstLetter = (text: string) => {
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index] ?? "";

    if (!LETTER_CHAR_RE.test(ch)) continue;

    return (
      text.slice(0, index) +
      ch.toLocaleUpperCase("mn-MN") +
      text.slice(index + 1)
    );
  }

  return text;
};

const hasPreservedSentencePunctuation = (text: string, end: number) => {
  let index = end;

  while (index < text.length) {
    const ch = text[index] ?? "";

    if (INLINE_SPACE_RE.test(ch)) {
      index += 1;
      continue;
    }

    return SENTENCE_END_CHAR_RE.test(ch);
  }

  return false;
};

const stripTrailingSentencePunctuation = (text: string) => {
  return text.replace(/[.!?]+$/g, "").trimEnd();
};

export const getTrailingLatinSegmentRange = (
  text: string,
): TextRange | null => {
  const source = text ?? "";
  const end = trimSentenceEnd(source);

  if (end <= 0) return null;
  if (!LATIN_CHAR_RE.test(source.slice(0, end))) return null;

  let index = end - 1;
  let seenLatin = false;

  while (index >= 0) {
    const ch = source[index] ?? "";

    if (LATIN_CHAR_RE.test(ch)) {
      seenLatin = true;
      index -= 1;
      continue;
    }

    if (!seenLatin) {
      return null;
    }

    if (TRAILING_LATIN_ALLOWED_RE.test(ch)) {
      index -= 1;
      continue;
    }

    if (CYRILLIC_CHAR_RE.test(ch)) {
      break;
    }

    break;
  }

  let start = index + 1;

  while (start < end && /\s/.test(source[start] ?? "")) {
    start += 1;
  }

  const segment = source.slice(start, end).trim();

  if (!segment) return null;
  if (!LATIN_CHAR_RE.test(segment)) return null;

  return {
    start,
    end,
    text: segment,
  };
};

export const getActiveSentenceRange = (text: string): TextRange => {
  const source = text ?? "";
  const end = trimSentenceEnd(source);

  if (end <= 0) {
    return { start: 0, end: 0, text: "" };
  }

  let start = 0;
  SENTENCE_BREAK_RE.lastIndex = 0;

  while (true) {
    const next = SENTENCE_BREAK_RE.exec(source);
    if (!next) break;
    if (next.index >= end) break;
    start = next.index + next[0].length;
  }

  while (start < end && /\s/.test(source[start] ?? "")) {
    start += 1;
  }

  return {
    start,
    end,
    text: source.slice(start, end).trim(),
  };
};

const getActiveReplacementRange = (text: string): TextRange => {
  const trailingLatin = getTrailingLatinSegmentRange(text);
  if (trailingLatin?.text) return trailingLatin;

  return getActiveSentenceRange(text);
};

export const getCheckTargetText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const trailingLatin = getTrailingLatinSegmentRange(trimmed);
  if (trailingLatin?.text) {
    return trailingLatin.text;
  }

  if (hasLatinText(trimmed)) {
    const activeSentence = getActiveSentenceRange(trimmed);
    if (activeSentence.text) {
      return activeSentence.text;
    }
  }

  return trimmed;
};

export const formatActiveReplacementText = (
  fullText: string,
  replacement: string,
) => {
  const range = getActiveReplacementRange(fullText);

  let next = replacement.trim();
  if (!next) return next;

  if (hasPreservedSentencePunctuation(fullText, range.end)) {
    next = stripTrailingSentencePunctuation(next);
  }

  if (shouldCapitalizeReplacement(fullText, range.start)) {
    next = capitalizeFirstLetter(next);
  }

  return next;
};

export const replaceActiveSentenceText = (
  fullText: string,
  replacement: string,
) => {
  const range = getActiveReplacementRange(fullText);
  const nextReplacement = formatActiveReplacementText(fullText, replacement);

  if (!range.text) {
    return nextReplacement;
  }

  return (
    fullText.slice(0, range.start) + nextReplacement + fullText.slice(range.end)
  );
};
