export const cleanText = (text: string) => text.trim();

export const countLatinLetters = (text: string) => {
  const matches = text.match(/[A-Za-z]/g);
  return matches ? matches.length : 0;
};

export const countCyrillicLetters = (text: string) => {
  const matches = text.match(/[А-Яа-яӨөҮүЁё]/g);
  return matches ? matches.length : 0;
};

export const hasCyrillic = (text: string) => /[А-Яа-яӨөҮүЁё]/.test(text);

export const isMostlyLatin = (text: string) => {
  const latinCount = countLatinLetters(text);
  const cyrillicCount = countCyrillicLetters(text);

  return latinCount > 0 && latinCount >= cyrillicCount;
};

export const normalizeWord = (text: string) => text.trim().toLowerCase();
