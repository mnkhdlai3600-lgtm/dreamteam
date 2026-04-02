import { renderSuggestionIndicator } from "./render";
import { removeSuggestionDropdown, updateIndicatorPosition } from "../../ui";
import {
  getElementText,
  resolveActiveEditable,
  verifyElementText,
  setElementText,
  clearHighlights,
  flashCorrectedWord,
} from "../../dom";
import { shouldSkipApplySuggestion } from "../guard";
import {
  clearSuggestion,
  latestSuggestion,
  setActiveElement,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setIsApplyingHotkey,
  setIsApplyingSuggestion,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckedText,
  setLatestSuggestion,
  setSuggestionPhase,
  setSuppressInputUntil,
} from "../state";
import {
  APPLY_GUARD_MS,
  APPLY_RESET_MS,
  SUPPRESS_INPUT_MS,
} from "../../../lib/constants";

export const applySuggestion = () => {
  const resolved = resolveActiveEditable();
  if (shouldSkipApplySuggestion() || !resolved || !latestSuggestion) return;

  setActiveElement(resolved);

  const currentText = getElementText(resolved).trim();
  if (!currentText) return;

  setIsApplyingHotkey(true);

  const suggestion = latestSuggestion;
  setLatestSuggestion(null);
  setSuppressInputUntil(Date.now() + SUPPRESS_INPUT_MS);
  setIsApplyingSuggestion(true);
  setIsSuggestionLoading(false);

  try {
    removeSuggestionDropdown();

    const ok = setElementText(resolved, suggestion);

    if (!ok) {
      setSuggestionPhase("idle");
      renderSuggestionIndicator();
      updateIndicatorPosition(resolved);
      return;
    }

    setLastAppliedText(suggestion);
    setLastCheckedText(suggestion.trim());
    clearSuggestion();
    clearHighlights(resolved);
    flashCorrectedWord(resolved, suggestion);

    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);
    setSuggestionPhase("idle");

    renderSuggestionIndicator();
    updateIndicatorPosition(resolved);

    window.setTimeout(() => {
      if (!verifyElementText(resolved, suggestion)) return;

      setIndicatorVisualState("idle");
      setIndicatorErrorCount(0);
      renderSuggestionIndicator();
      updateIndicatorPosition(resolved);
    }, 1200);
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), APPLY_RESET_MS);
    window.setTimeout(() => setIsApplyingHotkey(false), APPLY_GUARD_MS);
  }
};
