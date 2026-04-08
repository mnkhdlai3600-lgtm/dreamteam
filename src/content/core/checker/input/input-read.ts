import { getElementText } from "../../../dom";
import {
  getGoogleDocsText,
  getGoogleDocsTextCache,
  isGoogleDocsSite,
  syncGoogleDocsTextCache,
} from "../../../dom/google-docs";

const GOOGLE_DOCS_READ_DELAY_MS = 120;

const readGoogleDocsText = async (
  editable: HTMLElement,
  preferCache: boolean,
) => {
  await new Promise((resolve) =>
    window.setTimeout(resolve, GOOGLE_DOCS_READ_DELAY_MS),
  );

  if (preferCache) {
    const cached = getGoogleDocsTextCache().trim();
    if (cached) return cached;
  }

  const synced = syncGoogleDocsTextCache(editable).trim();
  if (synced) return synced;

  const fresh = getGoogleDocsText().trim();
  if (fresh) return fresh;

  return getGoogleDocsTextCache().trim();
};

export const readEditableTextAsync = async (
  editable: HTMLElement,
  preferCache: boolean,
) => {
  if (!isGoogleDocsSite()) {
    return getElementText(editable).trim();
  }

  return readGoogleDocsText(editable, preferCache);
};
