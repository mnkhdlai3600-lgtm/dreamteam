import type { HighlightErrorItem } from "../error-state";

export type ErrorItem = {
  id: string;
  word: string;
  start?: number;
  end?: number;
};

export type SingleWordSuggestResult = {
  suggestions: string[];
  corrected: string | null;
};

export type CheckResponseData = {
  corrected?: unknown;
  suggestions?: unknown;
  errorWords?: unknown;
};

export type CheckContext = {
  trimmed: string;
  corrected: string;
  displaySuggestions: string[];
  errorWords: ErrorItem[];
  isLatinInput: boolean;
  hasSentenceCorrection: boolean;
  hasSuggestions: boolean;
  isAutoAdvancing: boolean;
  justApplied: boolean;
};

export type ApplyVisualStateResult = {
  currentEditable: HTMLElement;
  highlightedItems: HighlightErrorItem[];
  autoAdvanceHandled: boolean;
};
