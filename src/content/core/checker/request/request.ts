// src/content/core/checker/request/request.ts

import { removeIndicator, updateIndicatorPosition } from "../../../ui";
import { sendCheckTextMessage } from "../../../../lib/chrome";
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
  setLastCheckedText,
  setLastCheckWasLatin,
  setLastDocsRequestPrefix,
  setLastDocsRequestText,
  setShouldAutoAdvanceError,
} from "../../state";
import { renderSuggestionIndicator } from "../render";
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
import { clearHighlightedErrors } from "../../error-state";
import { buildCheckContext } from "./context";
import { applyVisualState } from "./visual";
import { syncSuggestionState } from "./suggestions";
import { getCheckTargetText } from "../apply/apply-utils";
import type { CheckResponseData } from "./types";

<<<<<<< HEAD
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
  payload: Record<string, unknown> = {},
) => {
  console.log(`${DOCS_REQUEST_LOG} ${label}`, payload);
=======
type CheckTextOptions = {
  useFullText?: boolean;
>>>>>>> temp-fix
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
  const matches = [...text.matchAll(CLAUSE_BREAK_RE)];
  const last = matches[matches.length - 1];

  if (!last || last.index == null) {
    return 0;
  }

  return last.index + last[0].length;
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

const getNonDocsLatinScopedPayload = (text: string) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return { requestText: "", prefix: "" };
  }

  const applied = (lastAppliedText ?? "").trim();
  if (applied) {
    const byApplied = buildDeltaPayload(trimmedText, applied);
    if (byApplied.requestText) {
      return byApplied;
    }
  }

  const checked = lastCheckedText.trim();
  if (checked) {
    const byChecked = buildDeltaPayload(trimmedText, checked);
    if (byChecked.requestText) {
      return byChecked;
    }
  }

  return buildClauseScopedPayload(trimmedText);
};

const getScopedPayload = (text: string) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return { requestText: "", prefix: "" };
  }

  if (isGoogleDocsSite()) {
    return getDocsScopedPayload(trimmedText);
  }

  if (hasLatinChars(trimmedText)) {
    return getNonDocsLatinScopedPayload(trimmedText);
  }

  return { requestText: trimmedText, prefix: "" };
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
<<<<<<< HEAD
  const docsSite = isGoogleDocsSite();
  const scoped = getScopedPayload(trimmed);
  const requestText = scoped.requestText.trim();
  const justApplied = !!lastAppliedText && trimmed === lastAppliedText.trim();

  logDocsRequest("check:start", {
    docsSite,
    inputText: previewText(text),
    trimmed: previewText(trimmed),
    requestText: previewText(requestText),
    prefix: previewText(scoped.prefix),
    justApplied,
  });

  if (!requestText) {
    logDocsRequest("check:skip-empty-request");
=======
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
>>>>>>> temp-fix
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
    setLastDocsRequestText(requestText);
    setLastDocsRequestPrefix(scoped.prefix);

    logDocsRequest("check:set-docs-scope", {
      requestText: previewText(requestText),
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
<<<<<<< HEAD
    const response = await sendCheckTextMessage(requestText);

=======
    const response = await sendCheckTextMessage(targetText);
    console.log("[болор][request-response]", {
      targetText,
      corrected: response?.data?.corrected,
      suggestions: response?.data?.suggestions,
      errorWords: response?.data?.errorWords,
    });
>>>>>>> temp-fix
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

    logDocsRequest("check:after-response", {
      requestText: previewText(requestText),
      currentText: previewText(currentText),
      responseCorrected: previewText(
        typeof response.data.corrected === "string"
          ? response.data.corrected
          : "",
      ),
      responseSuggestions: Array.isArray(response.data.suggestions)
        ? response.data.suggestions
        : [],
      responseErrorWords: Array.isArray(response.data.errorWords)
        ? response.data.errorWords
        : [],
    });

    if (!currentText && !docsSite) {
      return;
    }

<<<<<<< HEAD
    if (!docsSite) {
      const normalizedCurrent = normalizeCompareText(currentText);
      const normalizedRequest = normalizeCompareText(requestText);

      if (
        normalizedCurrent &&
        normalizedRequest &&
        !normalizedCurrent.endsWith(normalizedRequest)
      ) {
        return;
      }
    }

    if (docsSite && currentText) {
      const sameEnough = isDocsTextCloseEnough(currentText, requestText);

      logDocsRequest("check:docs-compare", {
        currentText: previewText(currentText),
        requestText: previewText(requestText),
        sameEnough,
        currentLength: normalizeCompareText(currentText).length,
        requestLength: normalizeCompareText(requestText).length,
      });

      if (!sameEnough) {
        const currentLen = normalizeCompareText(currentText).length;
        const checkedLen = normalizeCompareText(requestText).length;
        const lengthGap = Math.abs(currentLen - checkedLen);

        if (lengthGap > 120) {
          logDocsRequest("check:skip-length-gap", {
            currentLen,
            checkedLen,
            lengthGap,
          });
=======
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
>>>>>>> temp-fix
          return;
        }
      }
    }

    const ctx = buildCheckContext(
<<<<<<< HEAD
      requestText,
=======
      targetText,
>>>>>>> temp-fix
      response.data as CheckResponseData,
      justApplied,
    );

    const shouldKeepLatinActive =
      hasLatinChars(requestText) || hasLatinChars(currentText);

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

<<<<<<< HEAD
    syncSuggestionState(currentEditable, ctx, autoAdvanceHandled);
    setLastCheckedText(docsSite ? currentText : requestText);

    logDocsRequest("check:done", {
      savedLastCheckedText: previewText(docsSite ? currentText : requestText),
    });
  } catch (error) {
    logDocsRequest("check:error", {
      error: error instanceof Error ? error.message : String(error),
    });

=======
    syncSuggestionState(
      currentEditable,
      ctx,
      autoAdvanceHandled,
      options.useFullText ?? false,
    );
    setLastCheckedText(targetText);
  } catch {
>>>>>>> temp-fix
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
