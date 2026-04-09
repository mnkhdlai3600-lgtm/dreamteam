import {
  isGoogleDocsSite,
  resetGoogleDocsTextCache,
  syncGoogleDocsTextCache,
  updateGoogleDocsTextCacheFromKeyboardEvent,
} from "../../../dom/google-docs";
import { shouldSkipHandleInput } from "../../guard";
import { runInputFlow } from "./flow";

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

export const boundDocs = new WeakSet<Document>();

export const isDocsKeyboardEventAllowed = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (IGNORED_KEYS.has(event.key)) return false;
  return true;
};

export const bindInputListener = (doc: Document, source: string) => {
  if (boundDocs.has(doc)) return;
  boundDocs.add(doc);

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

      window.setTimeout(() => {
        runInputFlow(event, `${source}:keyup`);
      }, 0);
    },
    true,
  );
};
