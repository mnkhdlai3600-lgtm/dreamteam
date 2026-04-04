export type ErrorItem = {
  id: string;
  word: string;
  start: number;
  end: number;
};

export type SingleWordSuggestResult = {
  suggestions: string[];
  corrected: string | null;
};
