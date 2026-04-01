export type HighlightErrorItem = {
  id: string;
  word: string;
};

let highlightedErrors: HighlightErrorItem[] = [];
let hoveredErrorId: string | null = null;

export const setHighlightedErrors = (items: HighlightErrorItem[]) => {
  highlightedErrors = items;
};

export const getHighlightedErrors = () => highlightedErrors;

export const clearHighlightedErrors = () => {
  highlightedErrors = [];
  hoveredErrorId = null;
};

export const setHoveredErrorId = (value: string | null) => {
  hoveredErrorId = value;
};

export const getHoveredErrorId = () => hoveredErrorId;

export const getHighlightedErrorById = (id: string) =>
  highlightedErrors.find((item) => item.id === id) ?? null;
