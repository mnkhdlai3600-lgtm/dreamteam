import {
  getActiveDocsPage,
  normalizeDocsCacheText,
  readDocsTextFromPage,
} from "./docs-text";

let docsTextCache = "";

const isPlainTypingKey = (key: string) => {
  if (key.length !== 1) return false;
  return !/[\u0000-\u001F]/.test(key);
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
  const activePage = getActiveDocsPage(target);
  const fromPage = readDocsTextFromPage(activePage);

  if (fromPage) {
    docsTextCache = normalizeDocsCacheText(fromPage);
    return docsTextCache;
  }

  return normalizeDocsCacheText(docsTextCache);
};

export const updateGoogleDocsTextCacheFromKeyboardEvent = (
  event: KeyboardEvent,
) => {
  const key = event.key;

  if (key === "Backspace") {
    docsTextCache = docsTextCache.slice(0, -1);
    return docsTextCache;
  }

  if (key === "Enter") {
    docsTextCache += "\n";
    docsTextCache = normalizeDocsCacheText(docsTextCache);
    return docsTextCache;
  }

  if (key === "Tab" || key === " ") {
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

export const getGoogleDocsText = () => {
  const activePage = getActiveDocsPage();
  const fromPage = readDocsTextFromPage(activePage);

  if (fromPage) {
    docsTextCache = normalizeDocsCacheText(fromPage);
    return docsTextCache;
  }

  return normalizeDocsCacheText(docsTextCache);
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
