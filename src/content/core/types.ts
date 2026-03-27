export type CheckMode =
  | "openai-galig"
  | "bolor-suggest"
  | "openai-then-bolor"
  | "none";

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  mode: CheckMode;
};

export type CheckResponse = {
  success: boolean;
  data?: CheckResult;
  error?: string;
};
