import type { ErrorItem, WordToken } from "./spell-type";

export const toErrorItem = (token: WordToken, index: number): ErrorItem => {
  return {
    id: `error-${token.start}-${token.end}-${index}`,
    word: token.value,
    start: token.start,
    end: token.end,
  };
};

export const getCyrillicWordTokens = (text: string): WordToken[] => {
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

export const buildSentenceByReplacingToken = (
  text: string,
  token: WordToken,
  replacement: string,
) => {
  return text.slice(0, token.start) + replacement + text.slice(token.end);
};
