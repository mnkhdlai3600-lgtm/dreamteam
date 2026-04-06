import { getEventEditableTarget, isGoogleDocsSite } from "../../dom";
import {
  getGoogleDocsIframeDocument,
  resetGoogleDocsTextCache,
  syncGoogleDocsTextCache,
  updateGoogleDocsTextCacheFromKeyboardEvent,
} from "../../dom/google-docs";
import { updateIndicatorPosition } from "../../ui";
import { renderSuggestionIndicator } from "../checker/render";
import { shouldSkipHandleInput } from "../guard";
import {
  hasSuggestions,
  isSuggestionLoading,
  setActiveElement,
  setSuggestionPhase,
  clearSuggestion,
} from "../state";
import { handleInput } from "../checker/input";

let boundDocsDocument: Document | null = null;
let docsBindTimer: number | null = null;

const runInputFlow = (event: Event) => {
  if (isGoogleDocsSite()) {
    syncGoogleDocsTextCache(event.target);
  }

  if (shouldSkipHandleInput()) return;

  const target = getEventEditableTarget(event);
  if (!target) return;

  setActiveElement(target);

  const hadSuggestionUi = hasSuggestions() || isSuggestionLoading;

  if (hadSuggestionUi) {
    clearSuggestion();
    setSuggestionPhase("typing");
    void renderSuggestionIndicator();
  } else {
    setSuggestionPhase("typing");
    updateIndicatorPosition(target);
  }

  handleInput();
};

const bindInputListener = (doc: Document) => {
  doc.addEventListener(
    "input",
    (event) => {
      runInputFlow(event);
    },
    true,
  );

  doc.addEventListener(
    "focusin",
    () => {
      if (isGoogleDocsSite()) {
        resetGoogleDocsTextCache();
        syncGoogleDocsTextCache(doc.body);
      }
    },
    true,
  );

  doc.addEventListener(
    "keydown",
    (event) => {
      if (!isGoogleDocsSite()) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      updateGoogleDocsTextCacheFromKeyboardEvent(event);
    },
    true,
  );

  doc.addEventListener(
    "keyup",
    (event) => {
      if (!isGoogleDocsSite()) return;
      if (shouldSkipHandleInput()) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const ignored = [
        "Shift",
        "Control",
        "Alt",
        "Meta",
        "CapsLock",
        "Escape",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ];

      if (ignored.includes(event.key)) return;

      window.setTimeout(() => {
        runInputFlow(event);
      }, 0);
    },
    true,
  );
};

const ensureDocsIframeListeners = () => {
  if (!isGoogleDocsSite()) return;

  const iframeDoc = getGoogleDocsIframeDocument();
  if (!iframeDoc) return;
  if (iframeDoc === boundDocsDocument) return;

  bindInputListener(iframeDoc);
  boundDocsDocument = iframeDoc;
};

export const registerInputEvents = () => {
  bindInputListener(document);

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
