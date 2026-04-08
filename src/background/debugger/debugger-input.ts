import { DEBUGGER_DELAY_MS } from "./debugger-types";
import { sendDebuggerCommand } from "./debugger-core";

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

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

export const pressKey = async (
  tabId: number,
  params: Record<string, unknown>,
) => {
  await keyDown(tabId, params);
  await sleep(DEBUGGER_DELAY_MS);
  await keyUp(tabId, params);
  await sleep(DEBUGGER_DELAY_MS);
};

export const runSelectAll = async (tabId: number) => {
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

export const runDeleteSelection = async (tabId: number) => {
  await pressKey(tabId, {
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
    nativeVirtualKeyCode: 8,
  });
};

export const runInsertText = async (tabId: number, text: string) => {
  await sendDebuggerCommand(tabId, "Input.insertText", { text });
  await sleep(DEBUGGER_DELAY_MS * 2);
};
