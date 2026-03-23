import { checkText } from "../api/check-spell";

console.log("Background script loaded");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CHECK_TEXT") {
    (async () => {
      try {
        const text = message.payload?.text ?? "";
        console.log("BG GOT TEXT:", text);

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
});
