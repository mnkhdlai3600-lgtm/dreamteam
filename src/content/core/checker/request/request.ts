import { removeIndicator, updateIndicatorPosition } from "../../../ui";
import { sendCheckTextMessage } from "../../../../lib/chrome";
import {
  activeElement,
  clearSuggestion,
  lastAppliedText,
  resetIndicatorVisualState,
  setActiveElement,
  setLastCheckedText,
  setLastCheckWasLatin,
  setShouldAutoAdvanceError,
} from "../../state";
import { renderSuggestionIndicator } from "../render";
import {
  clearHighlights,
  getElementText,
  resolveActiveEditable,
} from "../../../dom";
import {
  getGoogleDocsText,
  getGoogleDocsTextCache,
  isGoogleDocsSite,
  setGoogleDocsTextCache,
  syncGoogleDocsTextCache,
} from "../../../dom/google-docs";
import { clearHighlightedErrors } from "../../error-state";
import { buildCheckContext } from "./context";
import { applyVisualState } from "./visual";
import { syncSuggestionState } from "./suggestions";
import type { CheckResponseData } from "./types";

const normalizeCompareText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

const getCurrentComparableText = (editable: HTMLElement) => {
  if (!isGoogleDocsSite()) {
    return getElementText(editable).trim();
  }

  const synced = syncGoogleDocsTextCache(editable);
  if (synced.trim()) return synced.trim();

  const cached = getGoogleDocsTextCache().trim();
  if (cached) return cached;

  return getGoogleDocsText().trim();
};

const isDocsTextCloseEnough = (currentText: string, checkedText: string) => {
  const current = normalizeCompareText(currentText);
  const checked = normalizeCompareText(checkedText);

  if (!current || !checked) return false;
  if (current === checked) return true;

  return current.includes(checked) || checked.includes(current);
};

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

  if (isGoogleDocsSite()) {
    setGoogleDocsTextCache(trimmed);
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

    const currentText = getCurrentComparableText(currentEditable);

    if (!currentText && !isGoogleDocsSite()) {
      return;
    }

    if (!isGoogleDocsSite() && currentText !== trimmed) {
      return;
    }

    if (isGoogleDocsSite() && currentText) {
      const sameEnough = isDocsTextCloseEnough(currentText, trimmed);

      if (!sameEnough) {
        const currentLen = normalizeCompareText(currentText).length;
        const checkedLen = normalizeCompareText(trimmed).length;
        const lengthGap = Math.abs(currentLen - checkedLen);

        if (lengthGap > 120) {
          console.log("[болор][docs][request] skipped-large-drift", {
            currentText,
            trimmed,
            currentLen,
            checkedLen,
          });
          return;
        }
      }
    }

    const ctx = buildCheckContext(
      trimmed,
      response.data as CheckResponseData,
      justApplied,
    );

    setLastCheckWasLatin(ctx.isLatinInput);

    const { autoAdvanceHandled } = await applyVisualState(currentEditable, ctx);

    syncSuggestionState(currentEditable, ctx, autoAdvanceHandled);
    setLastCheckedText(trimmed);
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
