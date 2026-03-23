import { checkShortTextWithBolor } from "./bolor-spell";

export type CheckResult = {
  original: string;
  corrected: string;
  changed: boolean;
  suggestions: string[];
  mode: "openai-galig" | "bolor-suggest" | "none";
};

export const checkText = async (text: string): Promise<CheckResult> => {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      original: text,
      corrected: text,
      changed: false,
      suggestions: [],
      mode: "none",
    };
  }

  const suggestions = await checkShortTextWithBolor(trimmed);
  const corrected = suggestions[0] ?? trimmed;

  return {
    original: text,
    corrected,
    changed: corrected !== text,
    suggestions,
    mode: corrected !== text ? "bolor-suggest" : "none",
  };
};
