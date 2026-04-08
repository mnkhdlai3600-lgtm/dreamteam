export type ErrorItem = {
  id: string;
  word: string;
  start: number;
  end: number;
};

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  errorWords: ErrorItem[];
  mode: "openai-galig" | "bolor-suggest" | "none";
};

export type WordToken = {
  value: string;
  start: number;
  end: number;
};
