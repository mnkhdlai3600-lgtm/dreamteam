import {
  getGoogleDocsTextCache,
  resetGoogleDocsTextCache,
  resolveGoogleDocsActiveEditable,
  scheduleGoogleDocsTextResync,
  setGoogleDocsTextCache,
  syncGoogleDocsTextCache,
} from "../../../dom/google-docs";
import {
  lastDocsRequestPrefix,
  lastDocsRequestText,
  selectedErrorRange,
} from "../../state";

const DOCS_APPLY_LOG = "[docs-apply-debug]";

const previewText = (value: string, limit = 160) => {
  const safe = value
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

  if (safe.length <= limit) return safe;
  return `${safe.slice(0, limit)}...`;
};

const normalizeComparableText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const logDocsApply = (label: string, payload: Record<string, unknown> = {}) => {
  console.log(`${DOCS_APPLY_LOG} ${label}`, payload);
};

const buildScopedFallbackText = () => {
  const prefix = lastDocsRequestPrefix.trim();
  const requestText = lastDocsRequestText.trim();

  if (!prefix && !requestText) return "";

  return [prefix, requestText].filter(Boolean).join(" ").trim();
};

const replaceBySelectedRange = (
  currentText: string,
  replacement: string,
  expectedWord?: string,
) => {
  if (!selectedErrorRange) {
    logDocsApply("range-skip:no-selected-range");
    return null;
  }

  const { start, end } = selectedErrorRange;

  if (end <= start || start < 0 || end > currentText.length) {
    logDocsApply("range-skip:invalid-range", {
      start,
      end,
      currentLength: currentText.length,
    });
    return null;
  }

  const selectedText = currentText.slice(start, end);

  if (
    expectedWord &&
    normalizeComparableText(selectedText) !==
      normalizeComparableText(expectedWord)
  ) {
    logDocsApply("range-skip:expected-word-mismatch", {
      expectedWord: previewText(expectedWord),
      selectedText: previewText(selectedText),
    });
    return null;
  }

  const nextText =
    currentText.slice(0, start) + replacement + currentText.slice(end);

  logDocsApply("range-hit", {
    expectedWord: previewText(expectedWord ?? ""),
    selectedText: previewText(selectedText),
    replacement: previewText(replacement),
    nextText: previewText(nextText),
  });

  return nextText;
};

const replaceFirstExpectedWord = (
  currentText: string,
  replacement: string,
  expectedWord?: string,
) => {
  if (!expectedWord) {
    logDocsApply("word-skip:no-expected-word");
    return null;
  }

  const escaped = escapeRegex(expectedWord);
  const regex = new RegExp(`(^|\\s)(${escaped})(?=\\s|$)`);
  const match = currentText.match(regex);

  if (!match || match.index == null) {
    logDocsApply("word-skip:not-found", {
      expectedWord: previewText(expectedWord),
      currentText: previewText(currentText),
    });
    return null;
  }

  const prefix = match[1] ?? "";
  const wordStart = match.index + prefix.length;
  const wordEnd = wordStart + expectedWord.length;

  const nextText =
    currentText.slice(0, wordStart) + replacement + currentText.slice(wordEnd);

  logDocsApply("word-hit", {
    expectedWord: previewText(expectedWord),
    replacement: previewText(replacement),
    wordStart,
    wordEnd,
    nextText: previewText(nextText),
  });

  return nextText;
};

const replaceExactTrailingText = (
  currentText: string,
  trailingText: string,
  replacement: string,
) => {
  const currentTrimmedEnd = currentText.trimEnd();
  const trailingTrimmed = trailingText.trim();

  if (!currentTrimmedEnd || !trailingTrimmed || !replacement) {
    logDocsApply("tail-skip:empty-input", {
      currentTrimmedEnd: previewText(currentTrimmedEnd),
      trailingTrimmed: previewText(trailingTrimmed),
      replacement: previewText(replacement),
    });
    return null;
  }

  if (!currentTrimmedEnd.endsWith(trailingTrimmed)) {
    logDocsApply("tail-skip:not-ending-with-scope", {
      currentTrimmedEnd: previewText(currentTrimmedEnd),
      trailingTrimmed: previewText(trailingTrimmed),
    });
    return null;
  }

  const startIndex = currentTrimmedEnd.length - trailingTrimmed.length;
  if (startIndex < 0) {
    logDocsApply("tail-skip:invalid-start-index", {
      startIndex,
      currentLength: currentTrimmedEnd.length,
      trailingLength: trailingTrimmed.length,
    });
    return null;
  }

  const nextText = currentTrimmedEnd.slice(0, startIndex) + replacement;

  logDocsApply("tail-hit", {
    trailingTrimmed: previewText(trailingTrimmed),
    replacement: previewText(replacement),
    nextText: previewText(nextText),
  });

  return nextText;
};

const buildNextLatinTextForDocs = (
  currentText: string,
  replacement: string,
) => {
  const scopedText = lastDocsRequestText;
  const scopedPrefix = lastDocsRequestPrefix;

  logDocsApply("latin-build:start", {
    currentText: previewText(currentText),
    replacement: previewText(replacement),
    scopedText: previewText(scopedText),
    scopedPrefix: previewText(scopedPrefix),
  });

  if (!currentText || !replacement) {
    logDocsApply("latin-build:skip-empty", {
      currentText: previewText(currentText),
      replacement: previewText(replacement),
    });
    return currentText;
  }

  if (scopedPrefix && scopedText) {
    const fullScopedText = `${scopedPrefix} ${scopedText}`.trim();

    if (
      normalizeComparableText(currentText) ===
      normalizeComparableText(fullScopedText)
    ) {
      const nextText = `${scopedPrefix} ${replacement}`.trim();

      logDocsApply("latin-build:full-scope-hit", {
        fullScopedText: previewText(fullScopedText),
        nextText: previewText(nextText),
      });

      return nextText;
    }
  }

  if (scopedText) {
    const byScopedTail = replaceExactTrailingText(
      currentText,
      scopedText,
      replacement,
    );

    if (byScopedTail && byScopedTail !== currentText) {
      logDocsApply("latin-build:tail-scope-hit", {
        nextText: previewText(byScopedTail),
      });
      return byScopedTail;
    }
  }

  logDocsApply("latin-build:no-match", {
    currentText: previewText(currentText),
    replacement: previewText(replacement),
    scopedText: previewText(scopedText),
    scopedPrefix: previewText(scopedPrefix),
  });

  return currentText;
};

export const buildNextTextForDocs = (
  currentText: string,
  replacement: string,
  expectedWord?: string,
) => {
  logDocsApply("cyrillic-build:start", {
    currentText: previewText(currentText),
    replacement: previewText(replacement),
    expectedWord: previewText(expectedWord ?? ""),
  });

  const byRange = replaceBySelectedRange(
    currentText,
    replacement,
    expectedWord,
  );
  if (byRange && byRange !== currentText) {
    logDocsApply("cyrillic-build:range-result", {
      nextText: previewText(byRange),
    });
    return byRange;
  }

  const byWord = replaceFirstExpectedWord(
    currentText,
    replacement,
    expectedWord,
  );
  if (byWord && byWord !== currentText) {
    logDocsApply("cyrillic-build:word-result", {
      nextText: previewText(byWord),
    });
    return byWord;
  }

  logDocsApply("cyrillic-build:no-match", {
    currentText: previewText(currentText),
    replacement: previewText(replacement),
    expectedWord: previewText(expectedWord ?? ""),
  });

  return currentText;
};

export const applyDocsReplace = async (nextText: string) => {
  logDocsApply("replace:send-message", {
    nextText: previewText(nextText),
    nextLength: nextText.length,
  });

  const response = await chrome.runtime.sendMessage({
    type: "DOCS_DEBUGGER_REPLACE",
    payload: { text: nextText },
  });

  logDocsApply("replace:response", {
    success: !!response?.success,
    response,
  });

  return !!response?.success;
};

export const getDocsCurrentText = (resolved: HTMLElement) => {
  const synced = syncGoogleDocsTextCache(resolved);
  if (synced) {
    logDocsApply("current-text:from-synced", {
      text: previewText(synced),
      length: synced.length,
    });
    return synced;
  }

  const cached = getGoogleDocsTextCache();
  if (cached) {
    logDocsApply("current-text:from-cache", {
      text: previewText(cached),
      length: cached.length,
    });
    return cached;
  }

  const scopedFallback = buildScopedFallbackText();
  if (scopedFallback) {
    logDocsApply("current-text:from-scoped-fallback", {
      text: previewText(scopedFallback),
      length: scopedFallback.length,
    });
    return scopedFallback;
  }

  logDocsApply("current-text:empty", {});
  return "";
};

export const syncDocsStateAfterApply = (
  resolved: HTMLElement,
  nextText: string,
) => {
  const target = resolveGoogleDocsActiveEditable() ?? resolved;

  logDocsApply("state-sync:before", {
    nextText: previewText(nextText),
    target,
  });

  resetGoogleDocsTextCache();
  setGoogleDocsTextCache(nextText);
  syncGoogleDocsTextCache(target);
  scheduleGoogleDocsTextResync(target);

  logDocsApply("state-sync:after", {
    cache: previewText(getGoogleDocsTextCache()),
  });
};

export const applySuggestionToDocs = async (
  currentText: string,
  suggestion: string,
  isLatinInput: boolean,
  expectedWord?: string,
) => {
  logDocsApply("apply:start", {
    currentText: previewText(currentText),
    suggestion: previewText(suggestion),
    isLatinInput,
    expectedWord: previewText(expectedWord ?? ""),
    lastDocsRequestText: previewText(lastDocsRequestText),
    lastDocsRequestPrefix: previewText(lastDocsRequestPrefix),
  });

  const nextText = isLatinInput
    ? buildNextLatinTextForDocs(currentText, suggestion)
    : buildNextTextForDocs(currentText, suggestion, expectedWord);

  logDocsApply("apply:built-next-text", {
    currentText: previewText(currentText),
    nextText: previewText(nextText),
    sameAsCurrent:
      normalizeComparableText(nextText) ===
      normalizeComparableText(currentText),
  });

  if (
    normalizeComparableText(nextText) === normalizeComparableText(currentText)
  ) {
    logDocsApply("apply:skip-same-text", {
      currentText: previewText(currentText),
      nextText: previewText(nextText),
    });

    return {
      ok: false,
      nextText: currentText,
    };
  }

  const ok = await applyDocsReplace(nextText);

  logDocsApply("apply:done", {
    ok,
    nextText: previewText(nextText),
  });

  return {
    ok,
    nextText,
  };
};
