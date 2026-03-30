export const uniqueSuggestions = (items: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const value = item.trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
};

export const isPureSingleCyrillicWord = (text: string) => {
  return /^[А-Яа-яӨөҮүЁё]+$/.test(text);
};

export const buildDisplaySuggestions = (
  trimmed: string,
  corrected: string,
  suggestions: string[],
) => {
  const hasLatin = /[a-zA-Z]/.test(trimmed);
  const isSingleCyrillicWord = isPureSingleCyrillicWord(trimmed);

  let displaySuggestions: string[] = [];

  if (isSingleCyrillicWord) {
    displaySuggestions = suggestions.filter((item) => item !== trimmed);

    if (!displaySuggestions.length && corrected && corrected !== trimmed) {
      displaySuggestions = [corrected];
    }
  } else {
    const finalSuggestion =
      corrected && corrected !== trimmed
        ? corrected
        : suggestions[0] && suggestions[0] !== trimmed
          ? suggestions[0]
          : "";

    displaySuggestions = finalSuggestion ? [finalSuggestion] : [];
  }

  return {
    displaySuggestions,
    hasLatin,
  };
};
