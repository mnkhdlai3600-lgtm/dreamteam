import {
  getGoogleDocsIframeDocument,
  isGoogleDocsSite,
} from "../../../dom/google-docs";
import { bindInputListener } from "./bind";

let docsBindTimer: number | null = null;

const ensureDocsIframeListeners = () => {
  if (!isGoogleDocsSite()) return;

  const iframeDoc = getGoogleDocsIframeDocument();

  if (!iframeDoc) return;
  bindInputListener(iframeDoc, "docs-iframe");
};

export const registerInputEvents = () => {
  bindInputListener(document, "main-document");

  if (!isGoogleDocsSite()) return;

  ensureDocsIframeListeners();

  document.addEventListener(
    "focusin",
    () => {
      ensureDocsIframeListeners();
    },
    true,
  );

  if (docsBindTimer) {
    window.clearInterval(docsBindTimer);
  }

  docsBindTimer = window.setInterval(() => {
    ensureDocsIframeListeners();
  }, 1000);
};
