// src/content/core/events/input/bind.ts

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

const RECENT_RICH_INPUT_WINDOW_MS = 1500;

export const boundDocs = new WeakSet<Document>();

let lastPasteLikeInputAt = 0;
let lastPasteLikeInputType = "";

export const isDocsKeyboardEventAllowed = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (IGNORED_KEYS.has(event.key)) return false;
  return true;
};

const markRecentPasteLikeInput = (type: string) => {
  lastPasteLikeInputAt = Date.now();
  lastPasteLikeInputType = type;
};

export const wasRecentPasteLikeInput = () => {
  return Date.now() - lastPasteLikeInputAt <= RECENT_RICH_INPUT_WINDOW_MS;
};

export const getRecentPasteLikeInputType = () => {
  if (!wasRecentPasteLikeInput()) return "";
  return lastPasteLikeInputType;
};

export const bindInputListener = (doc: Document, source: string) => {
  if (boundDocs.has(doc)) return;
  boundDocs.add(doc);

  doc.addEventListener(
    "beforeinput",
    (event) => {
      const inputType =
        event && "inputType" in event
          ? (event as InputEvent).inputType || ""
          : "";

      if (
        inputType === "insertFromPaste" ||
        inputType === "insertFromDrop" ||
        inputType === "insertFromYank" ||
        inputType === "historyUndo" ||
        inputType === "historyRedo"
      ) {
        markRecentPasteLikeInput(inputType);
      }
    },
    true
  );

  doc.addEventListener(
    "paste",
    () => {
      markRecentPasteLikeInput("insertFromPaste");
    },
    true
  );

  doc.addEventListener(
    "drop",
    () => {
      markRecentPasteLikeInput("insertFromDrop");
    },
    true
  );

  doc.addEventListener(
    "input",
    (event) => {
      runInputFlow(event, `${source}:input`);
    },
    true
  );

  doc.addEventListener(
    "focusin",
    (event) => {
      if (!isGoogleDocsSite()) return;

      resetGoogleDocsTextCache();
      syncGoogleDocsTextCache(event.target);
    },
    true
  );

  doc.addEventListener(
    "keydown",
    (event) => {
      if (!isGoogleDocsSite()) return;
      if (!isDocsKeyboardEventAllowed(event)) return;

      updateGoogleDocsTextCacheFromKeyboardEvent(event);
    },
    true
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
    true
  );
};
