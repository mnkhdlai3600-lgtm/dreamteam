import { checkText } from "../api/check-spell";

console.log("Bolor AI background service worker loaded");

type CheckTextMessage = {
  type: "CHECK_TEXT";
  payload?: {
    text?: string;
  };
};

type PingMessage = {
  type: "PING";
};

type IncomingMessage = CheckTextMessage | PingMessage;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Bolor AI extension installed");
});

chrome.runtime.onStartup?.addListener(() => {
  console.log("Bolor AI browser startup detected");
});

chrome.runtime.onMessage.addListener(
  (
    message: IncomingMessage,
    _sender,
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

    sendResponse({
      success: false,
      error: "Unknown message type",
    });
    return false;
  },
);
