import { updateIndicatorPosition } from "../../../ui";
import { renderSuggestionIndicator } from "../render";
import {
  clearSuggestion,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
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

export const syncSuggestionState = (
  currentEditable: HTMLElement,
  ctx: CheckContext,
  autoAdvanceHandled: boolean,
) => {
  if (!autoAdvanceHandled) {
    const nextSuggestions = getNextSuggestions(ctx);

    const shouldShowSuggestions =
      nextSuggestions.length > 0 &&
      (ctx.isLatinInput ||
        ctx.errorWords.length > 0 ||
        ctx.hasSentenceCorrection ||
        ctx.hasSuggestions);

    if (shouldShowSuggestions) {
      setLatestSuggestions(nextSuggestions);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(nextSuggestions[0] ?? null);
      setSuggestionPhase("suggesting");

      if (ctx.isLatinInput || ctx.hasSentenceCorrection) {
        setIndicatorVisualState("latin");
        setIndicatorErrorCount(0);
      } else if (ctx.errorWords.length > 0 || ctx.hasSuggestions) {
        setIndicatorVisualState("error");
        setIndicatorErrorCount(
          ctx.errorWords.length > 0 ? ctx.errorWords.length : 1,
        );
      }
    } else {
      clearSuggestion();
      setSelectedSuggestionIndex(0);
      setSuggestionPhase("idle");
    }
  }

  renderSuggestionIndicator();
  updateIndicatorPosition(currentEditable);
};
