import {
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
  setShouldApplyFullTextSuggestion,
  setSuggestionPhase,
} from "../state";

type PersistedSuggestion = {
  editable: HTMLElement | null;
  requestText: string;
  suggestions: string[];
  selectedIndex: number;
  shouldApplyFullTextSuggestion: boolean;
};

let persistedSuggestion: PersistedSuggestion | null = null;

export const savePersistedSuggestion = (value: PersistedSuggestion | null) => {
  if (!value || !value.editable || value.suggestions.length === 0) {
    persistedSuggestion = null;
    return;
  }

  persistedSuggestion = {
    editable: value.editable,
    requestText: value.requestText,
    suggestions: value.suggestions,
    selectedIndex: value.selectedIndex,
    shouldApplyFullTextSuggestion: value.shouldApplyFullTextSuggestion,
  };
};

export const clearPersistedSuggestion = () => {
  persistedSuggestion = null;
};

export const hidePersistedSuggestion = () => {
  setSuggestionPhase("idle");
};

export const restorePersistedSuggestionForElement = (
  editable: HTMLElement | null,
) => {
  if (!persistedSuggestion || !editable) return false;
  if (persistedSuggestion.editable !== editable) return false;

  const selectedIndex = Math.min(
    Math.max(persistedSuggestion.selectedIndex, 0),
    Math.max(persistedSuggestion.suggestions.length - 1, 0),
  );

  const selected =
    persistedSuggestion.suggestions[selectedIndex] ??
    persistedSuggestion.suggestions[0] ??
    null;

  if (!selected) return false;

  setLatestSuggestions(persistedSuggestion.suggestions);
  setSelectedSuggestionIndex(selectedIndex);
  setLatestSuggestion(selected);
  setShouldApplyFullTextSuggestion(
    persistedSuggestion.shouldApplyFullTextSuggestion,
  );
  setSuggestionPhase("suggesting");
  return true;
};
