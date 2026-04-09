import {
  getVisibleDocsPages,
  normalizeDocsCacheText,
  readDocsTextFromPages,
} from "./docs-text";

let docsTextCache = "";

const isPlainTypingKey = (key: string) => {
  if (key.length !== 1) return false;
  return !/[\u0000-\u001F]/.test(key);
};

const normalizeComparableText = (value: string) =>
  normalizeDocsCacheText(value)
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeNoSpaceText = (value: string) =>
  normalizeComparableText(value).replace(/\s+/g, "");

const countSpaces = (value: string) =>
  (normalizeComparableText(value).match(/\s/g) ?? []).length;

const hasLatinLetters = (value: string) => /[A-Za-z]/.test(value);

const areTextsEquivalent = (pageText: string, cacheText: string) => {
  const pageComparable = normalizeComparableText(pageText);
  const cacheComparable = normalizeComparableText(cacheText);
  const pageNoSpace = normalizeNoSpaceText(pageText);
  const cacheNoSpace = normalizeNoSpaceText(cacheText);

  if (!pageComparable || !cacheComparable) return false;
  return pageComparable === cacheComparable || pageNoSpace === cacheNoSpace;
};

const shouldPreferCacheOverPage = (
  normalizedPage: string,
  normalizedCache: string,
) => {
  if (!normalizedPage || !normalizedCache) return false;

  const pageComparable = normalizeComparableText(normalizedPage);
  const cacheComparable = normalizeComparableText(normalizedCache);
  const pageNoSpace = normalizeNoSpaceText(normalizedPage);
  const cacheNoSpace = normalizeNoSpaceText(normalizedCache);
  const pageSpaces = countSpaces(normalizedPage);
  const cacheSpaces = countSpaces(normalizedCache);

  if (!pageNoSpace || !cacheNoSpace) return false;

  if (
    cacheComparable.length > pageComparable.length &&
    cacheComparable.includes(pageComparable)
  ) {
    return true;
  }

  if (
    cacheNoSpace.length > pageNoSpace.length &&
    cacheNoSpace.includes(pageNoSpace)
  ) {
    return true;
  }

  const sameContent = areTextsEquivalent(normalizedPage, normalizedCache);

  if (!sameContent) {
    return false;
  }

  if (pageNoSpace === cacheNoSpace && cacheSpaces > pageSpaces) {
    return true;
  }

  const latinSpacingLost =
    hasLatinLetters(normalizedCache) &&
    cacheSpaces > 0 &&
    pageSpaces === 0 &&
    pageNoSpace === cacheNoSpace;

  if (latinSpacingLost) {
    return true;
  }

  const pageLooksCollapsed =
    hasLatinLetters(normalizedCache) &&
    cacheSpaces > pageSpaces &&
    pageComparable.replace(/\s+/g, "") === cacheComparable.replace(/\s+/g, "");

  if (pageLooksCollapsed) {
    return true;
  }

  return false;
};

const chooseBetterDocsText = (pageText: string, cachedText: string) => {
  const normalizedPage = normalizeDocsCacheText(pageText);
  const normalizedCache = normalizeDocsCacheText(cachedText);

  if (!normalizedPage) return normalizedCache;
  if (!normalizedCache) return normalizedPage;

  if (shouldPreferCacheOverPage(normalizedPage, normalizedCache)) {
    return normalizedCache;
  }

  return normalizedPage;
};

export const resetGoogleDocsTextCache = () => {
  docsTextCache = "";
};

export const setGoogleDocsTextCache = (value: string) => {
  docsTextCache = normalizeDocsCacheText(value);
};

export const getGoogleDocsTextCache = () =>
  normalizeDocsCacheText(docsTextCache);

export const syncGoogleDocsTextCache = (target?: EventTarget | null) => {
  const visiblePages = getVisibleDocsPages(target);
  const fromPages = readDocsTextFromPages(visiblePages);
  const currentCache = normalizeDocsCacheText(docsTextCache);

  if (fromPages) {
    const next = chooseBetterDocsText(fromPages, currentCache);
    docsTextCache = next;
    return next;
  }

  return currentCache;
};

export const getGoogleDocsText = (target?: EventTarget | null) => {
  const visiblePages = getVisibleDocsPages(target);
  const fromPages = readDocsTextFromPages(visiblePages);
  const currentCache = normalizeDocsCacheText(docsTextCache);

  if (fromPages) {
    const next = chooseBetterDocsText(fromPages, currentCache);
    docsTextCache = next;
    return next;
  }

  return currentCache;
};

export const updateGoogleDocsTextCacheFromKeyboardEvent = (
  event: KeyboardEvent,
) => {
  const key = event.key;

  if (key === "Backspace" || key === "Delete") {
    docsTextCache = "";
    return docsTextCache;
  }

  if (key === "Enter") {
    docsTextCache = "";
    return docsTextCache;
  }

  if (key === "Tab") {
    docsTextCache = "";
    return docsTextCache;
  }

  if (key === " ") {
    docsTextCache += " ";
    docsTextCache = normalizeDocsCacheText(docsTextCache);
    return docsTextCache;
  }

  if (isPlainTypingKey(key)) {
    docsTextCache += key;
    docsTextCache = normalizeDocsCacheText(docsTextCache);
    return docsTextCache;
  }

  return docsTextCache;
};

export const scheduleGoogleDocsTextResync = (target?: EventTarget | null) => {
  [60, 180, 350].forEach((delay) => {
    window.setTimeout(() => {
      syncGoogleDocsTextCache(target);
    }, delay);
  });
};

export const isDocsStructuralInput = (event: InputEvent | Event) => {
  const inputType = event instanceof InputEvent ? event.inputType || "" : "";

  return (
    inputType === "insertFromPaste" ||
    inputType === "insertFromDrop" ||
    inputType === "deleteByCut" ||
    inputType === "historyUndo" ||
    inputType === "historyRedo"
  );
};
