import {
  isDocsStructuralInput,
  isGoogleDocsSite,
  resetGoogleDocsTextCache,
  setGoogleDocsTextCache,
} from "../../../dom/google-docs";

export const updateDocsCacheIfNeeded = (text: string) => {
  if (!isGoogleDocsSite()) return;

  if (!text.trim()) {
    resetGoogleDocsTextCache();
    return;
  }

  setGoogleDocsTextCache(text);
};

export const shouldPreferDocsCache = (event?: Event) => {
  if (!event) return true;
  if (isDocsStructuralInput(event)) return false;
  return true;
};
