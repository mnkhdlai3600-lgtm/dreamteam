import {
  clearHighlights,
  highlightErrorWords,
  getElementText,
  resolveActiveEditable,
} from "../../../dom";
import {
  getGoogleDocsText,
  getGoogleDocsTextCache,
  isGoogleDocsSite,
  syncGoogleDocsTextCache,
} from "../../../dom/google-docs";
import {
  activeElement,
  clearFocusedErrorId,
  setActiveElement,
  setFocusedErrorId,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setShouldAutoAdvanceError,
} from "../../state";
import {
  clearHighlightedErrors,
  setHighlightedErrors,
} from "../../error-state";
import { handleAutoAdvance } from "./auto-advance";
import type { ApplyVisualStateResult, CheckContext } from "./types";
import type { HighlightErrorItem } from "../../error-state";

const getLiveText = (editable: HTMLElement) => {
  if (isGoogleDocsSite()) {
    const synced = syncGoogleDocsTextCache(editable).trim();
    if (synced) return synced;

    const cached = getGoogleDocsTextCache().trim();
    if (cached) return cached;

    return getGoogleDocsText().trim();
  }

  return getElementText(editable).trim();
};

const buildDocsHighlightedItems = (ctx: CheckContext): HighlightErrorItem[] => {
  return ctx.errorWords.map((item) => ({
    id: item.id,
    word: item.word,
    start: item.start,
    end: item.end,
  }));
};

export const applyVisualState = async (
  currentEditable: HTMLElement,
  ctx: CheckContext,
): Promise<ApplyVisualStateResult> => {
  clearHighlights(currentEditable);
  clearHighlightedErrors();
  clearFocusedErrorId();

  let highlightedItems: HighlightErrorItem[] = [];
  let autoAdvanceHandled = false;
  const docsSite = isGoogleDocsSite();

  if (ctx.justApplied && ctx.errorWords.length === 0) {
    setIndicatorVisualState("success");
    setIndicatorErrorCount(0);
    setShouldAutoAdvanceError(false);

    window.setTimeout(() => {
      const latestEditable = resolveActiveEditable() ?? activeElement;
      if (!latestEditable) return;

      const latestText = getLiveText(latestEditable);
      const sameText = latestText.trim() === ctx.trimmed.trim();

      if (!sameText && !docsSite) return;

      setActiveElement(latestEditable);
      setIndicatorVisualState(ctx.isLatinInput ? "latin" : "idle");
      setIndicatorErrorCount(0);
    }, 1000);
  } else if (ctx.isLatinInput) {
    setIndicatorVisualState("latin");
    setIndicatorErrorCount(0);
    setShouldAutoAdvanceError(false);
  } else if (ctx.errorWords.length > 0) {
    if (docsSite) {
      highlightedItems = buildDocsHighlightedItems(ctx);
    } else {
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
    }

    setHighlightedErrors(highlightedItems);
    setIndicatorVisualState("error");
    setIndicatorErrorCount(highlightedItems.length || ctx.errorWords.length);

    if (ctx.isAutoAdvancing && !docsSite) {
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
  } else if (
    !ctx.isLatinInput &&
    (ctx.hasSentenceCorrection || ctx.hasSuggestions)
  ) {
    setIndicatorVisualState("error");
    setIndicatorErrorCount(1);
    setShouldAutoAdvanceError(false);
  } else if (ctx.hasSentenceCorrection || ctx.hasSuggestions) {
    setIndicatorVisualState("latin");
    setIndicatorErrorCount(0);
    setShouldAutoAdvanceError(false);
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
