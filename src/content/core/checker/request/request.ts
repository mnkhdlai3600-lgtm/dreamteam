// src/content/core/checker/request/request.ts

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
import { getCheckTargetText } from "../apply/apply-utils";
import type { CheckResponseData } from "./types";

type CheckTextOptions = {
  useFullText?: boolean;
};

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

export const checkText = async (
  text: string,
  options: CheckTextOptions = {},
) => {
  const trimmed = text.trim();
  const targetText = options.useFullText
    ? trimmed
    : getCheckTargetText(trimmed);
  const lastAppliedTarget = options.useFullText
    ? (lastAppliedText ?? "").trim()
    : getCheckTargetText(lastAppliedText ?? "");
  const justApplied = !!lastAppliedTarget && targetText === lastAppliedTarget;
  console.log("[болор][request-check]", {
    useFullText: options.useFullText ?? false,
    trimmed,
    targetText,
  });
  if (!trimmed || !targetText) {
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
    const response = await sendCheckTextMessage(targetText);
    console.log("[болор][request-response]", {
      targetText,
      corrected: response?.data?.corrected,
      suggestions: response?.data?.suggestions,
      errorWords: response?.data?.errorWords,
    });
    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Шалгалт амжилтгүй");
    }

    const currentEditable = resolveActiveEditable() ?? activeElement;
    if (!currentEditable) return;

    setActiveElement(currentEditable);

    const currentText = getCurrentComparableText(currentEditable);
    const currentTargetText = options.useFullText
      ? currentText.trim()
      : getCheckTargetText(currentText);

    if (!currentText && !isGoogleDocsSite()) {
      return;
    }

    if (!isGoogleDocsSite() && currentTargetText !== targetText) {
      return;
    }

    if (isGoogleDocsSite() && currentTargetText) {
      const sameEnough = isDocsTextCloseEnough(currentTargetText, targetText);

      if (!sameEnough) {
        const currentLen = normalizeCompareText(currentTargetText).length;
        const checkedLen = normalizeCompareText(targetText).length;
        const lengthGap = Math.abs(currentLen - checkedLen);

        if (lengthGap > 120) {
          return;
        }
      }
    }

    const ctx = buildCheckContext(
      targetText,
      response.data as CheckResponseData,
      justApplied,
    );

    setLastCheckWasLatin(ctx.isLatinInput);

    const { autoAdvanceHandled } = await applyVisualState(currentEditable, ctx);

    syncSuggestionState(
      currentEditable,
      ctx,
      autoAdvanceHandled,
      options.useFullText ?? false,
    );
    setLastCheckedText(targetText);
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
