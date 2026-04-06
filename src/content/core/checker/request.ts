import { removeIndicator, updateIndicatorPosition } from "../../ui";
import { sendCheckTextMessage } from "../../../lib/chrome";
import {
  activeElement,
  clearSuggestion,
  lastAppliedText,
  resetIndicatorVisualState,
  setActiveElement,
  setShouldAutoAdvanceError,
} from "../state";
import { renderSuggestionIndicator } from "./render";
import {
  clearHighlights,
  getElementText,
  isGoogleDocsSite,
  resolveActiveEditable,
} from "../../dom";
import { clearHighlightedErrors } from "../error-state";
import { buildCheckContext } from "./request-context";
import { applyVisualState } from "./request-visual";
import { syncSuggestionState } from "./request-suggestions";
import type { CheckResponseData } from "./request-types";

const normalizeCompareText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

export const checkText = async (text: string) => {
  const trimmed = text.trim();
  const justApplied = !!lastAppliedText && trimmed === lastAppliedText.trim();

  if (!trimmed) {
    clearSuggestion();
    clearHighlightedErrors();
    setShouldAutoAdvanceError(false);
    resetIndicatorVisualState();
    removeIndicator();
    return;
  }

  if (justApplied) {
    clearSuggestion();
    if (activeElement) clearHighlights(activeElement);
  }

  try {
    const response = await sendCheckTextMessage(trimmed);

    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Шалгалт амжилтгүй");
    }

    const currentEditable = resolveActiveEditable() ?? activeElement;
    if (!currentEditable) return;

    setActiveElement(currentEditable);

    const currentText = getElementText(currentEditable).trim();
    if (!currentText) return;

    const sameText = isGoogleDocsSite()
      ? normalizeCompareText(currentText) === normalizeCompareText(trimmed)
      : currentText === trimmed;

    if (!sameText) return;

    const ctx = buildCheckContext(
      trimmed,
      response.data as CheckResponseData,
      justApplied,
    );

    console.log("[bolor][ctx]", {
      isLatinInput: ctx.isLatinInput,
      corrected: ctx.corrected,
      displaySuggestions: ctx.displaySuggestions,
      hasSuggestions: ctx.hasSuggestions,
      hasSentenceCorrection: ctx.hasSentenceCorrection,
    });

    const { autoAdvanceHandled } = await applyVisualState(currentEditable, ctx);

    syncSuggestionState(currentEditable, ctx, autoAdvanceHandled);
  } catch {
    clearSuggestion();
    clearHighlightedErrors();
    resetIndicatorVisualState();
    setShouldAutoAdvanceError(false);

    const currentEditable = resolveActiveEditable() ?? activeElement;

    if (currentEditable) {
      clearHighlights(currentEditable);
      renderSuggestionIndicator();
      updateIndicatorPosition(currentEditable);
    } else {
      removeIndicator();
    }
  }
};
