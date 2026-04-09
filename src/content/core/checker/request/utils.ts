export const uniqueSuggestions = (items: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const value = item.trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
  }

  return result;
};

export const buildDisplaySuggestions = (
  original: string,
  corrected: string,
  suggestions: string[],
  isLatinInput: boolean,
) => {
  const trimmedOriginal = original.trim();
  const trimmedCorrected = corrected.trim();
  const normalizedOriginal = trimmedOriginal.replace(/\s+/g, " ").trim();

  const cleanedSuggestions = uniqueSuggestions(
    suggestions
      .map((item) => item.trim())
      .filter(Boolean)
      .filter(
        (item) => item.replace(/\s+/g, " ").trim() !== normalizedOriginal,
      ),
  );

  if (isLatinInput) {
    if (
      trimmedCorrected &&
      trimmedCorrected.replace(/\s+/g, " ").trim() !== normalizedOriginal
    ) {
      return [trimmedCorrected];
    }

    if (cleanedSuggestions.length > 0) {
      return cleanedSuggestions;
    }

    return [];
  }

  const result: string[] = [];

  if (
    trimmedCorrected &&
    trimmedCorrected.replace(/\s+/g, " ").trim() !== normalizedOriginal
  ) {
    result.push(trimmedCorrected);
  }

  for (const suggestion of cleanedSuggestions) {
    result.push(suggestion);
  }

  return uniqueSuggestions(result);
};
