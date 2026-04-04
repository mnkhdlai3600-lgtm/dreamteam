export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isWordChar = (char: string) => {
  return /[\p{L}\p{N}_]/u.test(char);
};

export const findWordRange = (text: string, word: string) => {
  const escaped = escapeRegExp(word.trim());
  if (!escaped) return null;

  const regex = new RegExp(escaped, "giu");
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const start = match.index;
    const end = start + matchedText.length;

    const prevChar = start > 0 ? text[start - 1] : "";
    const nextChar = end < text.length ? text[end] : "";

    const validLeft = !prevChar || !isWordChar(prevChar);
    const validRight = !nextChar || !isWordChar(nextChar);

    if (validLeft && validRight) {
      return { start, end };
    }
  }

  return null;
};
