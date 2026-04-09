import { DEBUGGER_DELAY_MS } from "./debugger-types";
import { ensureDebuggerAttached, sendDebuggerCommand } from "./debugger-core";
import {
  runDeleteSelection,
  runInsertText,
  runSelectAll,
  sleep,
} from "./debugger-input";

const DOCS_DEBUGGER_LOG = "[docs-debugger]";

const logDocsDebugger = (
  label: string,
  payload: Record<string, unknown> = {},
) => {
  console.log(`${DOCS_DEBUGGER_LOG} ${label}`, payload);
};

export const focusDocsSurface = async (tabId: number) => {
  const result = await sendDebuggerCommand<{ result?: { value?: boolean } }>(
    tabId,
    "Runtime.evaluate",
    {
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
    },
  );

  await sleep(DEBUGGER_DELAY_MS * 2);

  const focused = !!result?.result?.value;
  logDocsDebugger("focus", { tabId, focused });

  return focused;
};

export const replaceGoogleDocsTextByDebugger = async (
  tabId: number,
  text: string,
) => {
  logDocsDebugger("replace:start", {
    tabId,
    textLength: text.length,
  });

  await ensureDebuggerAttached(tabId);

  const focused = await focusDocsSurface(tabId);
  if (!focused) {
    throw new Error("Google Docs focus олдсонгүй");
  }

  await runSelectAll(tabId);
  await runDeleteSelection(tabId);
  await runInsertText(tabId, text);
  await sleep(DEBUGGER_DELAY_MS * 4);

  logDocsDebugger("replace:done", {
    tabId,
    success: true,
  });

  return true;
};
