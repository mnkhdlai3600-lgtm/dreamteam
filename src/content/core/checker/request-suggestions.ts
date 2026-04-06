import { updateIndicatorPosition } from "../../ui";
import { renderSuggestionIndicator } from "./render";
import {
  clearSuggestion,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedSuggestionIndex,
  setSuggestionPhase,
} from "../state";
import type { CheckContext } from "./request-types";

export const syncSuggestionState = (
  currentEditable: HTMLElement,
  ctx: CheckContext,
  autoAdvanceHandled: boolean,
) => {
  if (!autoAdvanceHandled) {
    if (ctx.isLatinInput && ctx.hasSuggestions) {
      setLatestSuggestions(ctx.displaySuggestions);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(ctx.displaySuggestions[0] ?? null);
      setSuggestionPhase("suggesting");
    } else if (ctx.isLatinInput && ctx.hasSentenceCorrection) {
      setLatestSuggestions([ctx.corrected]);
      setSelectedSuggestionIndex(0);
      setLatestSuggestion(ctx.corrected);
      setSuggestionPhase("suggesting");
    } else {
      clearSuggestion();
      setSelectedSuggestionIndex(0);
      setSuggestionPhase("idle");
    }
  }
  console.log("[болор][синк]", {
    isLatinInput: ctx.isLatinInput,
    hasSuggestions: ctx.hasSuggestions,
    hasSentenceCorrection: ctx.hasSentenceCorrection,
    displaySuggestions: ctx.displaySuggestions,
    autoAdvanceHandled,
  });
  renderSuggestionIndicator();
  updateIndicatorPosition(currentEditable);
};
