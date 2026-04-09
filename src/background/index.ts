import { checkText } from "../api/spell-check";
import type { IncomingMessage } from "./messages";
import { attachedTabs } from "./debugger/debugger-types";
import {
  detachDebugger,
  isPermissionLikeError,
} from "./debugger/debugger-core";
import { replaceGoogleDocsTextByDebugger } from "./debugger/docs-debugger";

console.log("Bolor AI background service worker loaded");

chrome.debugger.onDetach.addListener((source) => {
  if (typeof source.tabId === "number") {
    attachedTabs.delete(source.tabId);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Bolor AI extension installed");
});

chrome.runtime.onStartup?.addListener(() => {
  console.log("Bolor AI browser startup detected");
});

chrome.runtime.onMessage.addListener(
  (
    message: IncomingMessage,
    sender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (!message || typeof message !== "object") {
      sendResponse({
        success: false,
        error: "Invalid message format",
      });
      return false;
    }

    if (message.type === "PING") {
      sendResponse({
        success: true,
        message: "Background is ready",
      });
      return false;
    }

    if (message.type === "CHECK_TEXT") {
      (async () => {
        try {
          const rawText = message.payload?.text ?? "";
          const text = rawText.trim();

          console.log("BG GOT TEXT:", text);

          if (!text) {
            sendResponse({
              success: true,
              data: {
                original: "",
                corrected: "",
                changed: false,
                suggestions: [],
                errorWords: [],
                mode: "none",
              },
            });
            return;
          }

          const result = await checkText(text);

          console.log("BG RESULT:", result);

          sendResponse({
            success: true,
            data: result,
          });
        } catch (error) {
          console.error("CHECK_TEXT error:", error);

          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Тодорхойгүй алдаа",
          });
        }
      })();

      return true;
    }

    if (message.type === "DOCS_DEBUGGER_REPLACE") {
      (async () => {
        try {
          const tabId = sender.tab?.id;
          const rawText = message.payload?.text;

          if (!tabId) {
            sendResponse({
              success: false,
              error: "Tab олдсонгүй",
            });
            return;
          }

          if (typeof rawText !== "string") {
            sendResponse({
              success: false,
              error: "Текст буруу байна",
            });
            return;
          }

          if (rawText.length === 0) {
            sendResponse({
              success: false,
              error: "Хоосон текст байна",
            });
            return;
          }

          await replaceGoogleDocsTextByDebugger(tabId, rawText);

          sendResponse({
            success: true,
          });
        } catch (error) {
          console.error("DOCS_DEBUGGER_REPLACE error:", error);

          sendResponse({
            success: false,
            error: isPermissionLikeError(error)
              ? "Docs replace debugger attach дээр тасарлаа"
              : error instanceof Error
                ? error.message
                : "Тодорхойгүй алдаа",
          });
        }
      })();

      return true;
    }

    if (message.type === "DOCS_DEBUGGER_DETACH") {
      (async () => {
        try {
          const tabId = sender.tab?.id;

          if (tabId) {
            await detachDebugger(tabId);
          }

          sendResponse({
            success: true,
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Тодорхойгүй алдаа",
          });
        }
      })();

      return true;
    }

    sendResponse({
      success: false,
      error: "Unknown message type",
    });
    return false;
  },
);
