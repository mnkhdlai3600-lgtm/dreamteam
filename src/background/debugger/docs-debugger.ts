import { DEBUGGER_DELAY_MS } from "./debugger-types";
import { ensureDebuggerAttached, sendDebuggerCommand } from "./debugger-core";
import {
  runDeleteSelection,
  runInsertText,
  runSelectAll,
  sleep,
} from "./debugger-input";

const normalizeComparableText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim();

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
  return !!result?.result?.value;
};

const readDocsTextForVerify = async (tabId: number) => {
  const result = await sendDebuggerCommand<{ result?: { value?: string } }>(
    tabId,
    "Runtime.evaluate",
    {
      expression: `
        (() => {
          const pages = Array.from(
            document.querySelectorAll(
              ".kix-page-paginated, .kix-page-column, .kix-page"
            )
          );

          if (!pages.length) return "";

          const text = pages
            .map((page) => page.textContent || "")
            .filter(Boolean)
            .join("\\n")
            .replace(/\\u00A0/g, " ")
            .replace(/\\u200B/g, "")
            .replace(/\\r/g, "");

          return text;
        })();
      `,
      returnByValue: true,
      awaitPromise: true,
    },
  );

  return result?.result?.value ?? "";
};

export const replaceGoogleDocsTextByDebugger = async (
  tabId: number,
  text: string,
) => {
  await ensureDebuggerAttached(tabId);

  const focused = await focusDocsSurface(tabId);
  if (!focused) {
    throw new Error("Google Docs focus олдсонгүй");
  }

  await runSelectAll(tabId);
  await runDeleteSelection(tabId);
  await runInsertText(tabId, text);
  await sleep(DEBUGGER_DELAY_MS * 3);

  const actualText = await readDocsTextForVerify(tabId);
  const expected = normalizeComparableText(text);
  const actual = normalizeComparableText(actualText);

  if (expected && actual && actual.includes(expected)) {
    return true;
  }

  if (expected === actual) {
    return true;
  }

  throw new Error("Google Docs replace verify амжилтгүй");
};
