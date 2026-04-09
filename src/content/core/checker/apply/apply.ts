import { applySuggestionToInput } from "./apply-input";
import {
  applySuggestionToDocs,
  getDocsCurrentText,
  syncDocsStateAfterApply,
} from "./apply-docs";
import { applySuggestionToContentEditable } from "./apply-contenteditable";
import { hasLatinText } from "./apply-utils";
import { checkText } from "../request/request";
import { getElementText, resolveActiveEditable } from "../../../dom";
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
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setIsApplyingHotkey,
  setIsApplyingSuggestion,
  setIsSuggestionLoading,
  setLastAppliedText,
  setLastCheckedText,
  setLastCheckWasLatin,
  setLatestSuggestion,
  setPauseDocsSuggestionUntilInput,
  setShouldAutoAdvanceError,
  setSuggestionPhase,
  setDocsFrozenBaseText,
} from "../../state";
import { shouldSkipApplySuggestion } from "../../guard";
import { getHighlightedErrors } from "../../error-state";
import { removeSuggestionDropdown, updateIndicatorPosition } from "../../../ui";
import { renderSuggestionIndicator } from "../render";
import { APPLY_GUARD_MS, APPLY_RESET_MS } from "../../../../lib/constants";
import { isGoogleDocsSite } from "../../../dom/google-docs";

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
    ? (getHighlightedErrors().find((item) => item.id === targetErrorId) ?? null)
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
        targetError?.word,
      );
      ok = result.ok;
      nextText = result.nextText;
    } else {
      const result = await applySuggestionToContentEditable(
        resolved,
        suggestion,
        isLatinInput,
        targetErrorId,
        targetError?.word,
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
    setLastCheckedText(docsSite ? "" : nextText.trim());
    setLastCheckWasLatin(hasLatinText(nextText));
    setShouldAutoAdvanceError(!isLatinInput && !docsSite);

    if (docsSite) {
      console.log("[docs-apply] freeze-base", {
        nextText,
      });
      setPauseDocsSuggestionUntilInput(true);
      setDocsFrozenBaseText(nextText);
      syncDocsStateAfterApply(resolved, nextText);
    }

    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);
    renderSuggestionIndicator();
    updateIndicatorPosition(resolved);

    if (!docsSite) {
      window.setTimeout(() => {
        void checkText(nextText);
      }, 250);
    }
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), APPLY_RESET_MS);
    window.setTimeout(() => setIsApplyingHotkey(false), APPLY_GUARD_MS);
  }
};
