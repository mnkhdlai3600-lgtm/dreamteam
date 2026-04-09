import { updateIndicatorPosition } from "../../../ui";
import { renderSuggestionIndicator } from "../render";
import { savePersistedSuggestion } from "../persist";
import {
  clearSuggestion,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
  setShouldApplyFullTextSuggestion,
  setSuggestionPhase,
} from "../../state";
import type { CheckContext } from "./types";

const getNextSuggestions = (ctx: CheckContext) => {
  if (ctx.displaySuggestions.length > 0) {
    return ctx.displaySuggestions;
  }

  if (ctx.corrected) {
    return [ctx.corrected];
  }

  return [];
};

const isLongLatinFixAllTarget = (text: string) => {
  const normalized = text
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .trim();

  if (!normalized) return false;
  if (normalized.includes("\n")) return true;
  if (normalized.length >= 80) return true;

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return wordCount >= 8;
};

export const syncSuggestionState = (
  currentEditable: HTMLElement,
  ctx: CheckContext,
  autoAdvanceHandled: boolean,
  useFullTextSuggestion = false,
) => {
  if (!autoAdvanceHandled) {
    if (!ctx.isLatinInput && ctx.errorWords.length > 0) {
      clearSuggestion();
      setSelectedSuggestionIndex(0);
      setShouldApplyFullTextSuggestion(false);
      setSuggestionPhase("idle");
      renderSuggestionIndicator();
      updateIndicatorPosition(currentEditable);
      return;
    }

    const nextSuggestions = getNextSuggestions(ctx);
    const shouldForceFixAllOnly =
      ctx.isLatinInput && isLongLatinFixAllTarget(ctx.trimmed);

    const visibleSuggestions = shouldForceFixAllOnly
      ? nextSuggestions.slice(0, 1)
      : nextSuggestions;

    const shouldShowSuggestions =
      visibleSuggestions.length > 0 &&
      (ctx.isLatinInput || ctx.hasSentenceCorrection || ctx.hasSuggestions);

    if (shouldShowSuggestions) {
      const shouldApplyFullTextSuggestion =
        ctx.isLatinInput && (useFullTextSuggestion || shouldForceFixAllOnly);

      setLatestSuggestions(visibleSuggestions);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(visibleSuggestions[0] ?? null);
      setShouldApplyFullTextSuggestion(shouldApplyFullTextSuggestion);
      setSuggestionPhase("suggesting");

      savePersistedSuggestion({
        editable: currentEditable,
        requestText: ctx.trimmed,
        suggestions: visibleSuggestions,
        selectedIndex: 0,
        shouldApplyFullTextSuggestion,
      });
    } else {
      clearSuggestion();
      setSelectedSuggestionIndex(0);
      setShouldApplyFullTextSuggestion(false);
      setSuggestionPhase("idle");
    }
  }

  renderSuggestionIndicator();
  updateIndicatorPosition(currentEditable);
};
