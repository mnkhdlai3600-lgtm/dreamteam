import { checkText } from "../api/check-spell";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "CHECK_TEXT") return;

  (async () => {
    try {
      const text = message.payload?.text ?? "";
      const result = await checkText(text);

      sendResponse({
        ok: true,
        ...result,
      });
    } catch (error) {
      console.error("Background check error:", error);

      sendResponse({
        ok: false,
        message:
          error instanceof Error ? error.message : "Тодорхойгүй алдаа гарлаа",
      });
    }
  })();

  return true;
});
