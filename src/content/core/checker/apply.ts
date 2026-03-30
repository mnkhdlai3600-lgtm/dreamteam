import { createIndicator } from "../../ui/indicator";
import {
  getElementText,
  resolveActiveEditable,
  verifyElementText,
} from "../../dom/editable";
import { setElementText } from "../../dom/replace";
import { shouldSkipApplySuggestion } from "../guard";
import {
  clearSuggestion,
  latestSuggestion,
  setActiveElement,
  setIsApplyingHotkey,
  setIsApplyingSuggestion,
  setLastAppliedText,
  setLastCheckedText,
  setLatestSuggestion,
  setSuppressInputUntil,
} from "../state";
import {
  APPLY_GUARD_MS,
  APPLY_RESET_MS,
  SUPPRESS_INPUT_MS,
} from "../../../lib/constants";
import { clearHighlights, flashCorrectedWord } from "../../dom/highlight";

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

  try {
    const ok = setElementText(resolved, suggestion);

    if (!ok) {
      void createIndicator(resolved, "Replace амжилтгүй");
      return;
    }

    setLastAppliedText(suggestion);
    setLastCheckedText(suggestion.trim());
    clearSuggestion();
    clearHighlights(resolved);
    flashCorrectedWord(resolved, suggestion);

    window.setTimeout(() => {
      void createIndicator(
        resolved,
        verifyElementText(resolved, suggestion)
          ? "Засвар хэрэглэгдлээ"
          : "Replace амжилтгүй",
      );
    }, 120);
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), APPLY_RESET_MS);
    window.setTimeout(() => setIsApplyingHotkey(false), APPLY_GUARD_MS);
  }
};
