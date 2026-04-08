import { checkText } from "../api/check-spell";

console.log("Bolor AI background service worker loaded");

const DEBUGGER_VERSION = "1.3";
const DEBUGGER_DELAY_MS = 35;

type CheckTextMessage = {
  type: "CHECK_TEXT";
  payload?: {
    text?: string;
  };
};

type PingMessage = {
  type: "PING";
};

type DocsReplaceMessage = {
  type: "DOCS_DEBUGGER_REPLACE";
  payload?: {
    text?: string;
  };
};

type DocsDetachMessage = {
  type: "DOCS_DEBUGGER_DETACH";
};

type IncomingMessage =
  | CheckTextMessage
  | PingMessage
  | DocsReplaceMessage
  | DocsDetachMessage;

const attachedTabs = new Set<number>();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const getDebuggee = (tabId: number): chrome.debugger.Debuggee => ({ tabId });

const attachDebugger = (tabId: number) =>
  new Promise<void>((resolve, reject) => {
    chrome.debugger.attach(getDebuggee(tabId), DEBUGGER_VERSION, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });

const detachDebuggerInternal = (tabId: number) =>
  new Promise<void>((resolve) => {
    chrome.debugger.detach(getDebuggee(tabId), () => {
      resolve();
    });
  });

const sendDebuggerCommand = <T = unknown>(
  tabId: number,
  method: string,
  commandParams?: object,
) =>
  new Promise<T>((resolve, reject) => {
    const debuggee = getDebuggee(tabId);

    const callback = (result?: T) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve((result ?? undefined) as T);
    };

    const sendCommand = chrome.debugger.sendCommand as unknown as (
      target: chrome.debugger.Debuggee,
      method: string,
      commandParamsOrCallback?: object | ((result?: T) => void),
      callback?: (result?: T) => void,
    ) => void;

    if (commandParams !== undefined) {
      sendCommand(debuggee, method, commandParams, callback);
      return;
    }

    sendCommand(debuggee, method, callback);
  });

const isAlreadyAttachedError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("already attached");
};

const isPermissionLikeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  return (
    lower.includes("permission") ||
    lower.includes("debugger") ||
    lower.includes("cannot attach") ||
    lower.includes("target closed")
  );
};

const ensureDebuggerAttached = async (tabId: number) => {
  if (attachedTabs.has(tabId)) return;

  try {
    await attachDebugger(tabId);
    attachedTabs.add(tabId);
  } catch (error) {
    if (isAlreadyAttachedError(error)) {
      attachedTabs.add(tabId);
      return;
    }

    throw error;
  }
};

const detachDebugger = async (tabId: number) => {
  try {
    await detachDebuggerInternal(tabId);
  } catch {}
  attachedTabs.delete(tabId);
};

const keyDown = async (tabId: number, params: Record<string, unknown>) => {
  await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    ...params,
  });
};

const keyUp = async (tabId: number, params: Record<string, unknown>) => {
  await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
    type: "keyUp",
    ...params,
  });
};

const pressKey = async (tabId: number, params: Record<string, unknown>) => {
  await keyDown(tabId, params);
  await sleep(DEBUGGER_DELAY_MS);
  await keyUp(tabId, params);
  await sleep(DEBUGGER_DELAY_MS);
};

const runSelectAll = async (tabId: number) => {
  await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    commands: ["selectAll"],
    key: "a",
    code: "KeyA",
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
    modifiers: 4,
  });

  await sleep(DEBUGGER_DELAY_MS);

  await sendDebuggerCommand(tabId, "Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "a",
    code: "KeyA",
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
    modifiers: 4,
  });

  await sleep(DEBUGGER_DELAY_MS * 2);
};

const runDeleteSelection = async (tabId: number) => {
  await pressKey(tabId, {
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
    nativeVirtualKeyCode: 8,
  });
};

const runInsertText = async (tabId: number, text: string) => {
  await sendDebuggerCommand(tabId, "Input.insertText", { text });
  await sleep(DEBUGGER_DELAY_MS * 2);
};

const focusDocsSurface = async (tabId: number) => {
  await sendDebuggerCommand(tabId, "Runtime.evaluate", {
    expression: `
      (() => {
        const iframe = document.querySelector(".docs-texteventtarget-iframe");
        const iframeDoc = iframe?.contentDocument ?? null;

        const targets = [
          iframeDoc?.querySelector(".docs-texteventtarget-div"),
          iframeDoc?.querySelector('[role="textbox"]'),
          document.querySelector(".docs-texteventtarget-div"),
          document.querySelector('[aria-label="Document"][role="textbox"]'),
          document.querySelector('[aria-label="Документ"][role="textbox"]')
        ].filter(Boolean);

        const target = targets[0];
        if (target && typeof target.focus === "function") {
          target.focus();
          return true;
        }

        return false;
      })();
    `,
    returnByValue: true,
    awaitPromise: true,
  });

  await sleep(DEBUGGER_DELAY_MS * 2);
};

const replaceGoogleDocsTextByDebugger = async (tabId: number, text: string) => {
  await ensureDebuggerAttached(tabId);
  await focusDocsSurface(tabId);
  await runSelectAll(tabId);
  await runDeleteSelection(tabId);
  await runInsertText(tabId, text);
  return true;
};

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
          const rawText = message.payload?.text ?? "";
          const text = rawText.trim();

          if (!tabId) {
            sendResponse({
              success: false,
              error: "Tab олдсонгүй",
            });
            return;
          }

          if (!text) {
            sendResponse({
              success: false,
              error: "Хоосон текст байна",
            });
            return;
          }

          const ok = await replaceGoogleDocsTextByDebugger(tabId, text);

          sendResponse({
            success: ok,
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
