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

  if (isLatinInput) {
    if (trimmedCorrected && trimmedCorrected !== trimmedOriginal) {
      return [trimmedCorrected];
    }

    return [];
  }

  const result: string[] = [];

  if (trimmedCorrected && trimmedCorrected !== trimmedOriginal) {
    result.push(trimmedCorrected);
  }

  for (const suggestion of suggestions) {
    const value = suggestion.trim();
    if (!value) continue;
    if (value === trimmedOriginal) continue;
    result.push(value);
  }

  return uniqueSuggestions(result);
};
