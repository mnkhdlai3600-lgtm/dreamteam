import { DEBUGGER_DELAY_MS } from "./debugger-types";
import { ensureDebuggerAttached, sendDebuggerCommand } from "./debugger-core";
import {
  runDeleteSelection,
  runInsertText,
  runSelectAll,
  sleep,
} from "./debugger-input";

export const focusDocsSurface = async (tabId: number) => {
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

export const replaceGoogleDocsTextByDebugger = async (
  tabId: number,
  text: string,
) => {
  await ensureDebuggerAttached(tabId);
  await focusDocsSurface(tabId);
  await runSelectAll(tabId);
  await runDeleteSelection(tabId);
  await runInsertText(tabId, text);
  return true;
};
