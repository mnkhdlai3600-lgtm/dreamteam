export const isAllUpperCase = (text: string) => /^[А-ЯӨҮЁ]+$/.test(text.trim());

export const isTitleCase = (text: string) =>
  /^[А-ЯӨҮЁ][а-яөүё]+$/.test(text.trim());

export const applyOriginalCase = (original: string, suggestion: string) => {
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
