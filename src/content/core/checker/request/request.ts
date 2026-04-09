// src/content/core/checker/request/request.ts

import { sendCheckTextMessage } from "../../../../lib/chrome";
import {
  clearHighlights,
  getElementText,
  resolveActiveEditable,
} from "../../../dom";
import {
  getGoogleDocsTextCache,
  isGoogleDocsSite,
  setGoogleDocsTextCache,
  syncGoogleDocsTextCache,
} from "../../../dom/google-docs";
import { removeIndicator, updateIndicatorPosition } from "../../../ui";
import { clearHighlightedErrors } from "../../error-state";
import {
  activeElement,
  clearSuggestion,
  docsFrozenBaseText,
  lastAppliedText,
  lastCheckedText,
  resetDocsFrozenBaseText,
  resetIndicatorVisualState,
  resetLastDocsRequestScope,
  setActiveElement,
  setLastCheckWasLatin,
  setLastCheckedText,
  setLastDocsRequestPrefix,
  setLastDocsRequestText,
  setShouldAutoAdvanceError,
} from "../../state";
import { getCheckTargetText } from "../apply/apply-utils";
import { renderSuggestionIndicator } from "../render";
import { buildCheckContext } from "./context";
import { syncSuggestionState } from "./suggestions";
import type { CheckResponseData } from "./types";
import { applyVisualState } from "./visual";

type CheckTextOptions = {
  useFullText?: boolean;
};

const DOCS_REQUEST_LOG = "[docs-request-debug]";
const LATIN_RE = /[A-Za-z]/;
const CLAUSE_BREAK_RE = /([.?!]\s+|[,;:]\s+|\n+)/g;

const previewText = (value: string, limit = 160) => {
  const safe = value
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

  if (safe.length <= limit) return safe;
  return `${safe.slice(0, limit)}...`;
};

const logDocsRequest = (
  label: string,
  payload: Record<string, unknown> = {}
) => {
  console.log(`${DOCS_REQUEST_LOG} ${label}`, payload);
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

const hasLatinChars = (value: string) => LATIN_RE.test(value);

const getCurrentComparableText = (editable: HTMLElement) => {
  if (!isGoogleDocsSite()) {
    return getElementText(editable).trim();
  }

  const synced = syncGoogleDocsTextCache(editable);
  if (synced) {
    logDocsRequest("current-text:from-synced", {
      text: previewText(synced),
      length: synced.length,
    });
    return synced;
  }

  const cached = getGoogleDocsTextCache();
  if (cached) {
    logDocsRequest("current-text:from-cache", {
      text: previewText(cached),
      length: cached.length,
    });
    return cached;
  }

  logDocsRequest("current-text:empty");
  return "";
};

const getLastClauseStart = (text: string) => {
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;
  const regex = new RegExp(CLAUSE_BREAK_RE);

  while ((match = regex.exec(text)) !== null) {
    lastIndex = match.index + match[0].length;
  }

  return lastIndex;
};

const buildDeltaPayload = (fullText: string, baseText: string) => {
  const trimmedFull = fullText.trim();
  const trimmedBase = baseText.trim();

  if (!trimmedFull) {
    return { requestText: "", prefix: "" };
  }

  if (!trimmedBase) {
    return { requestText: trimmedFull, prefix: "" };
  }

  if (normalizeCompareText(trimmedFull) === normalizeCompareText(trimmedBase)) {
    return { requestText: "", prefix: trimmedBase };
  }

  if (trimmedFull.startsWith(trimmedBase)) {
    const requestText = trimmedFull.slice(trimmedBase.length).trim();
    return {
      requestText,
      prefix: trimmedBase,
    };
  }

  return { requestText: trimmedFull, prefix: "" };
};

const buildClauseScopedPayload = (text: string) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return { requestText: "", prefix: "" };
  }

  const clauseStart = getLastClauseStart(trimmedText);
  const requestText = trimmedText.slice(clauseStart).trim();

  if (!requestText) {
    return { requestText: trimmedText, prefix: "" };
  }

  return {
    requestText,
    prefix: trimmedText.slice(0, clauseStart).trimEnd(),
  };
};

const getDocsScopedPayload = (text: string) => {
  const trimmedText = text.trim();

  logDocsRequest("scope:start", {
    text: previewText(trimmedText),
    docsFrozenBaseText: previewText(docsFrozenBaseText),
    lastAppliedText: previewText(lastAppliedText ?? ""),
    lastCheckedText: previewText(lastCheckedText),
  });

  if (!trimmedText) {
    logDocsRequest("scope:empty");
    return { requestText: "", prefix: "" };
  }

  const frozen = docsFrozenBaseText.trim();
  if (frozen) {
    const byFrozen = buildDeltaPayload(trimmedText, frozen);

    logDocsRequest("scope:by-frozen", {
      frozen: previewText(frozen),
      requestText: previewText(byFrozen.requestText),
      prefix: previewText(byFrozen.prefix),
    });

    if (byFrozen.requestText || byFrozen.prefix) {
      return byFrozen;
    }

    resetDocsFrozenBaseText();
    logDocsRequest("scope:reset-frozen");
  }

  const applied = (lastAppliedText ?? "").trim();
  if (applied) {
    const byApplied = buildDeltaPayload(trimmedText, applied);

    logDocsRequest("scope:by-applied", {
      applied: previewText(applied),
      requestText: previewText(byApplied.requestText),
      prefix: previewText(byApplied.prefix),
    });

    if (byApplied.requestText || byApplied.prefix) {
      return byApplied;
    }
  }

  const byClause = buildClauseScopedPayload(trimmedText);

  logDocsRequest("scope:by-clause", {
    requestText: previewText(byClause.requestText),
    prefix: previewText(byClause.prefix),
  });

  return byClause;
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
  options: CheckTextOptions = {}
) => {
  const trimmed = text.trim();
  const docsSite = isGoogleDocsSite();

  const scoped = docsSite
    ? getDocsScopedPayload(trimmed)
    : {
        requestText: options.useFullText
          ? trimmed
          : getCheckTargetText(trimmed),
        prefix: "",
      };

  const targetText = scoped.requestText.trim();

  const lastAppliedTarget = docsSite
    ? (lastAppliedText ?? "").trim()
    : options.useFullText
    ? (lastAppliedText ?? "").trim()
    : getCheckTargetText(lastAppliedText ?? "");

  const justApplied = docsSite
    ? !!lastAppliedText && trimmed === lastAppliedText.trim()
    : !!lastAppliedTarget && targetText === lastAppliedTarget;

  logDocsRequest("check:start", {
    docsSite,
    useFullText: options.useFullText ?? false,
    inputText: previewText(text),
    trimmed: previewText(trimmed),
    targetText: previewText(targetText),
    prefix: previewText(scoped.prefix),
    justApplied,
  });

  if (!trimmed || !targetText) {
    clearSuggestion();
    clearHighlightedErrors();
    setShouldAutoAdvanceError(false);
    resetIndicatorVisualState();
    resetLastDocsRequestScope();
    removeIndicator();
    return;
  }

  if (docsSite) {
    setGoogleDocsTextCache(trimmed);
    setLastDocsRequestText(targetText);
    setLastDocsRequestPrefix(scoped.prefix);

    logDocsRequest("check:set-docs-scope", {
      targetText: previewText(targetText),
      prefix: previewText(scoped.prefix),
    });
  } else {
    resetLastDocsRequestScope();
  }

  if (justApplied) {
    clearSuggestion();
    if (activeElement) clearHighlights(activeElement);
  }

  try {
    const response = await sendCheckTextMessage(targetText);

    logDocsRequest("check:response", {
      targetText: previewText(targetText),
      corrected:
        typeof response?.data?.corrected === "string"
          ? previewText(response.data.corrected)
          : "",
      suggestions: Array.isArray(response?.data?.suggestions)
        ? response.data.suggestions
        : [],
      errorWords: Array.isArray(response?.data?.errorWords)
        ? response.data.errorWords
        : [],
    });

    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Шалгалт амжилтгүй");
    }

    const currentEditable = resolveActiveEditable() ?? activeElement;
    if (!currentEditable) return;

    setActiveElement(currentEditable);

    const currentText = getCurrentComparableText(currentEditable);
    const currentTargetText = docsSite
      ? currentText.trim()
      : options.useFullText
      ? currentText.trim()
      : getCheckTargetText(currentText);

    logDocsRequest("check:after-response", {
      targetText: previewText(targetText),
      currentText: previewText(currentText),
      currentTargetText: previewText(currentTargetText),
    });

    if (!currentText && !docsSite) {
      return;
    }

    if (!docsSite && currentTargetText !== targetText) {
      return;
    }

    if (docsSite && currentTargetText) {
      const sameEnough = isDocsTextCloseEnough(currentTargetText, targetText);

      logDocsRequest("check:docs-compare", {
        currentTargetText: previewText(currentTargetText),
        targetText: previewText(targetText),
        sameEnough,
        currentLength: normalizeCompareText(currentTargetText).length,
        targetLength: normalizeCompareText(targetText).length,
      });

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
      justApplied
    );

    const shouldKeepLatinActive =
      hasLatinChars(targetText) || hasLatinChars(currentText);

    ctx.isLatinInput = ctx.isLatinInput || shouldKeepLatinActive;

    logDocsRequest("check:context", {
      trimmed: previewText(ctx.trimmed),
      corrected: previewText(ctx.corrected),
      displaySuggestions: ctx.displaySuggestions,
      errorWords: ctx.errorWords,
      isLatinInput: ctx.isLatinInput,
      hasSentenceCorrection: ctx.hasSentenceCorrection,
      hasSuggestions: ctx.hasSuggestions,
    });

    setLastCheckWasLatin(ctx.isLatinInput);

    const { autoAdvanceHandled } = await applyVisualState(currentEditable, ctx);

    syncSuggestionState(
      currentEditable,
      ctx,
      autoAdvanceHandled,
      options.useFullText ?? false
    );

    setLastCheckedText(docsSite ? currentText : targetText);

    logDocsRequest("check:done", {
      savedLastCheckedText: previewText(docsSite ? currentText : targetText),
    });
  } catch (error) {
    logDocsRequest("check:error", {
      error: error instanceof Error ? error.message : String(error),
    });

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
