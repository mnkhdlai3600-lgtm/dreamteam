import {
  clearHighlights,
  highlightErrorWords,
  getElementText,
  resolveActiveEditable,
} from "../../dom";
import {
  activeElement,
  clearFocusedErrorId,
  setActiveElement,
  setFocusedErrorId,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setShouldAutoAdvanceError,
} from "../state";
import { clearHighlightedErrors, setHighlightedErrors } from "../error-state";
import { handleAutoAdvance } from "./request-auto-advance";
import type { ApplyVisualStateResult, CheckContext } from "./request-types";
import type { HighlightErrorItem } from "../error-state";

export const applyVisualState = async (
  currentEditable: HTMLElement,
  ctx: CheckContext,
): Promise<ApplyVisualStateResult> => {
  clearHighlights(currentEditable);
  clearHighlightedErrors();
  clearFocusedErrorId();

  let highlightedItems: HighlightErrorItem[] = [];
  let autoAdvanceHandled = false;

  if (ctx.isLatinInput) {
    setIndicatorVisualState("latin");
    setIndicatorErrorCount(0);
    setShouldAutoAdvanceError(false);
  } else if (ctx.errorWords.length > 0) {
    const inlineHighlighted = highlightErrorWords(
      currentEditable,
      ctx.errorWords.map((item) => item.word),
    );

    highlightedItems = inlineHighlighted.length
      ? inlineHighlighted.map((item, index) => ({
          ...item,
          start: ctx.errorWords[index]?.start,
          end: ctx.errorWords[index]?.end,
        }))
      : ctx.errorWords.map((item) => ({
          id: item.id,
          word: item.word,
          start: item.start,
          end: item.end,
        }));

    setHighlightedErrors(highlightedItems);
    setIndicatorVisualState("error");
    setIndicatorErrorCount(highlightedItems.length || ctx.errorWords.length);

    if (ctx.isAutoAdvancing) {
      autoAdvanceHandled = await handleAutoAdvance(
        resolveActiveEditable() ?? currentEditable,
        highlightedItems,
        highlightedItems.length || ctx.errorWords.length,
      );
    } else {
      setShouldAutoAdvanceError(false);

      if (highlightedItems.length === 1 && highlightedItems[0]?.id) {
        setFocusedErrorId(highlightedItems[0].id);
      }
    }
  } else if (ctx.hasSentenceCorrection || ctx.hasSuggestions) {
    setIndicatorVisualState(ctx.isLatinInput ? "latin" : "success");
    setIndicatorErrorCount(0);
    setShouldAutoAdvanceError(false);
  } else if (ctx.justApplied) {
    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);
    setShouldAutoAdvanceError(false);

    window.setTimeout(() => {
      const latestEditable = resolveActiveEditable() ?? activeElement;
      if (!latestEditable) return;

      const latestText = getElementText(latestEditable).trim();
      if (latestText !== ctx.trimmed) return;

      setActiveElement(latestEditable);
      setIndicatorVisualState("idle");
      setIndicatorErrorCount(0);
    }, 1000);
  } else {
    setIndicatorVisualState("idle");
    setIndicatorErrorCount(0);
    setShouldAutoAdvanceError(false);
  }

  return {
    currentEditable,
    highlightedItems,
    autoAdvanceHandled,
  };
};
