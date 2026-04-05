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
  resolveActiveEditable,
} from "../../dom";
import { clearHighlightedErrors } from "../error-state";
import { buildCheckContext } from "./request-context";
import { applyVisualState } from "./request-visual";
import { syncSuggestionState } from "./request-suggestions";
import type { CheckResponseData } from "./request-types";

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
    if (!currentText || currentText !== trimmed) return;

    const ctx = buildCheckContext(
      trimmed,
      response.data as CheckResponseData,
      justApplied,
    );

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
