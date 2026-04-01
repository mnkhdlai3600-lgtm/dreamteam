export type CheckMode =
  | "openai-galig"
  | "bolor-suggest"
  | "openai-then-bolor"
  | "none";

export type WordSuggestion = {
  word: string;
  suggestions: string[];
};

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  errorWords: string[];
  wordSuggestions?: WordSuggestion[];
  mode: CheckMode;
};
export type CheckResponse = {
  success: boolean;
  data?: CheckResult;
  error?: string;
};
