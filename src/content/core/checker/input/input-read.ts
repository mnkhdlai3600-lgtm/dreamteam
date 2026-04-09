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

  const cached = getGoogleDocsTextCache().trim();

  if (preferCache && cached) {
    return cached;
  }

  const synced = syncGoogleDocsTextCache(editable).trim();
  if (synced) {
    return synced;
  }

  if (cached) {
    return cached;
  }

  const fresh = getGoogleDocsText(editable).trim();
  if (fresh) {
    return fresh;
  }

  return "";
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
