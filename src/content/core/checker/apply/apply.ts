import { APPLY_GUARD_MS, APPLY_RESET_MS } from "../../../../lib/constants";
import { getElementText, resolveActiveEditable } from "../../../dom";
import { isGoogleDocsSite } from "../../../dom/google-docs";
import { removeSuggestionDropdown, updateIndicatorPosition } from "../../../ui";
import { getHighlightedErrors } from "../../error-state";
import { shouldSkipApplySuggestion } from "../../guard";
import {
  activeElement,
  cancelPendingRequests,
  clearFocusedErrorId,
  clearSelectedErrorRange,
  clearSuggestion,
  debounceTimer,
  focusedErrorId,
  getLastEditableElement,
  lastCheckWasLatin,
  latestSuggestion,
  setActiveElement,
  setDebounceTimer,
  setDocsFrozenBaseText,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setIsApplyingHotkey,
  setIsApplyingSuggestion,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckWasLatin,
  setLastCheckedText,
  setLatestSuggestion,
  setPauseDocsSuggestionUntilInput,
  setShouldAutoAdvanceError,
  setSuggestionPhase,
  setSuppressInputUntil,
} from "../../state";
import { renderSuggestionIndicator } from "../render";
import { applySuggestionToContentEditable } from "./apply-contenteditable";
import {
  applySuggestionToDocs,
  getDocsCurrentText,
  syncDocsStateAfterApply,
} from "./apply-docs";
import { applySuggestionToInput } from "./apply-input";
import { hasLatinText } from "./apply-utils";

export const applySuggestion = async () => {
  const resolved =
    activeElement ?? resolveActiveEditable() ?? getLastEditableElement();
  const suggestion = latestSuggestion;
  const targetErrorId = focusedErrorId;
  const docsSite = isGoogleDocsSite();

  const skipped = shouldSkipApplySuggestion();
  if (skipped || !resolved || !suggestion) {
    return;
  }

  if (!docsSite) {
    setActiveElement(resolved);
  }

  const currentText = docsSite
    ? getDocsCurrentText(resolved)
    : getElementText(resolved).trim();

  if (!currentText) {
    return;
  }

  const isLatinInput = docsSite
    ? lastCheckWasLatin || hasLatinText(currentText)
    : hasLatinText(currentText);

  const targetError = targetErrorId
    ? getHighlightedErrors().find((item) => item.id === targetErrorId) ?? null
    : null;

  setIsApplyingHotkey(true);
  setLatestSuggestion(null);
  setIsApplyingSuggestion(true);
  setIsSuggestionLoading(false);

  try {
    removeSuggestionDropdown();

    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    cancelPendingRequests();

    let ok = false;
    let nextText = currentText;

    if (
      resolved instanceof HTMLInputElement ||
      resolved instanceof HTMLTextAreaElement
    ) {
      const result = applySuggestionToInput(resolved, suggestion, isLatinInput);
      ok = result.ok;
      nextText = result.nextText;
    } else if (docsSite) {
      const result = await applySuggestionToDocs(
        currentText,
        suggestion,
        isLatinInput,
        targetError?.word
      );
      ok = result.ok;
      nextText = result.nextText;
    } else {
      const result = await applySuggestionToContentEditable(
        resolved,
        suggestion,
        isLatinInput,
        targetErrorId,
        targetError?.word
      );
      ok = result.ok;
      nextText = result.nextText;
    }

    if (!ok) {
      renderSuggestionIndicator();
      updateIndicatorPosition(resolved);
      return;
    }

    clearSuggestion();
    clearSelectedErrorRange();
    clearFocusedErrorId();
    setSuggestionPhase("idle");
    setIsSuggestionLoading(false);

    setLastAppliedText(nextText);
    setLastCheckedText(nextText.trim());
    setLastCheckWasLatin(hasLatinText(nextText));
    setShouldAutoAdvanceError(!isLatinInput && !docsSite);
    setSuppressInputUntil(Date.now() + APPLY_RESET_MS);

    if (docsSite) {
      setPauseDocsSuggestionUntilInput(true);
      setDocsFrozenBaseText(nextText);
      syncDocsStateAfterApply(resolved, nextText);
    }

    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);
    renderSuggestionIndicator();
    updateIndicatorPosition(resolved);
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), APPLY_RESET_MS);
    window.setTimeout(() => setIsApplyingHotkey(false), APPLY_GUARD_MS);
  }
};
