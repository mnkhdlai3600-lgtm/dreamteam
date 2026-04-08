import { attachedTabs, DEBUGGER_VERSION } from "./debugger-types";

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

export const sendDebuggerCommand = <T = unknown>(
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

export const isPermissionLikeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  return (
    lower.includes("permission") ||
    lower.includes("debugger") ||
    lower.includes("cannot attach") ||
    lower.includes("target closed")
  );
};

export const ensureDebuggerAttached = async (tabId: number) => {
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

export const detachDebugger = async (tabId: number) => {
  try {
    await detachDebuggerInternal(tabId);
  } catch {}

  attachedTabs.delete(tabId);
};
