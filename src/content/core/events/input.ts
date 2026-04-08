import { getEventEditableTarget, isGoogleDocsSite } from "../../dom";
import {
  getGoogleDocsIframeBody,
  getGoogleDocsIframeDocument,
  resetGoogleDocsTextCache,
  resolveGoogleDocsActiveEditable,
  syncGoogleDocsTextCache,
  updateGoogleDocsTextCacheFromKeyboardEvent,
} from "../../dom/google-docs";
import { updateIndicatorPosition } from "../../ui";
import { renderSuggestionIndicator } from "../checker/render";
import { shouldSkipHandleInput } from "../guard";
import {
  clearSuggestion,
  getLastEditableElement,
  hasSuggestions,
  isSuggestionLoading,
  setActiveElement,
  setSuggestionPhase,
} from "../state";
import { handleInput } from "../checker/input";

let docsBindTimer: number | null = null;
const boundDocs = new WeakSet<Document>();

const IGNORED_KEYS = new Set([
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
]);

const isDocsKeyboardEventAllowed = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (IGNORED_KEYS.has(event.key)) return false;
  return true;
};

const resolveInputTarget = (event: Event) => {
  const direct = getEventEditableTarget(event);
  if (direct) return direct;

  if (isGoogleDocsSite()) {
    const docsActive = resolveGoogleDocsActiveEditable();
    if (docsActive) return docsActive;

    const iframeBody = getGoogleDocsIframeBody();
    if (iframeBody) return iframeBody;

    const lastEditable = getLastEditableElement();
    if (lastEditable) return lastEditable;
  }

  return null;
};

const runInputFlow = (event: Event, source: string) => {
  console.log("[болор][input-event]", {
    source,
    type: event.type,
    target: event.target,
    docs: isGoogleDocsSite(),
  });

  if (isGoogleDocsSite()) {
    syncGoogleDocsTextCache(event.target);
  }

  if (shouldSkipHandleInput()) {
    console.log("[болор][input-event] skipped");
    return;
  }

  const target = resolveInputTarget(event);

  console.log("[болор][input-event] resolved-target", {
    target,
    docsActive: isGoogleDocsSite() ? resolveGoogleDocsActiveEditable() : null,
    iframeBody: isGoogleDocsSite() ? getGoogleDocsIframeBody() : null,
    lastEditable: getLastEditableElement(),
  });

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

const bindInputListener = (doc: Document, source: string) => {
  if (boundDocs.has(doc)) return;
  boundDocs.add(doc);

  console.log("[болор][input-bind] bound", {
    source,
    isDocs: isGoogleDocsSite(),
    doc,
  });

  doc.addEventListener(
    "input",
    (event) => {
      runInputFlow(event, `${source}:input`);
    },
    true,
  );

  doc.addEventListener(
    "focusin",
    (event) => {
      if (!isGoogleDocsSite()) return;

      console.log("[болор][input-focusin]", {
        source,
        target: event.target,
      });

      resetGoogleDocsTextCache();
      syncGoogleDocsTextCache(event.target);
    },
    true,
  );

  doc.addEventListener(
    "keydown",
    (event) => {
      if (!isGoogleDocsSite()) return;
      if (!isDocsKeyboardEventAllowed(event)) return;

      console.log("[болор][input-keydown]", {
        source,
        key: event.key,
        target: event.target,
      });

      updateGoogleDocsTextCacheFromKeyboardEvent(event);
    },
    true,
  );

  doc.addEventListener(
    "keyup",
    (event) => {
      if (!isGoogleDocsSite()) return;
      if (shouldSkipHandleInput()) return;
      if (!isDocsKeyboardEventAllowed(event)) return;

      console.log("[болор][input-keyup]", {
        source,
        key: event.key,
        target: event.target,
      });

      window.setTimeout(() => {
        runInputFlow(event, `${source}:keyup`);
      }, 0);
    },
    true,
  );
};

const ensureDocsIframeListeners = () => {
  if (!isGoogleDocsSite()) return;

  const iframeDoc = getGoogleDocsIframeDocument();

  console.log("[болор][input-ensure-iframe]", {
    hasIframeDoc: !!iframeDoc,
    iframeDoc,
  });

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
