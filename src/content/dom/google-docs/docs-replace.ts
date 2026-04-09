import {
  getGoogleDocsEventTarget,
  getGoogleDocsIframeBody,
  resolveGoogleDocsActiveEditable,
} from "./docs-core";
import {
  normalizeDocsCacheText,
  normalizeDocsComparableText,
} from "./docs-text";
import {
  scheduleGoogleDocsTextResync,
  setGoogleDocsTextCache,
  syncGoogleDocsTextCache,
} from "./docs-cache";

const getDocsOwnerDocument = (target: HTMLElement) => {
  return target.ownerDocument ?? document;
};

const getDocsSelection = (target: HTMLElement) => {
  const ownerDocument = getDocsOwnerDocument(target);
  const view = ownerDocument.defaultView;
  return view?.getSelection?.() ?? ownerDocument.getSelection?.() ?? null;
};

const focusDocsTarget = (target: HTMLElement) => {
  try {
    target.focus({ preventScroll: true });
    return;
  } catch {}

  try {
    target.focus();
  } catch {}
};

const selectAllDocsContent = (target: HTMLElement) => {
  const ownerDocument = getDocsOwnerDocument(target);
  const selection = getDocsSelection(target);
  if (!selection) return false;

  focusDocsTarget(target);

  try {
    const range = ownerDocument.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
};

const getDocsCommandTarget = () => {
  return (
    getGoogleDocsIframeBody() ??
    resolveGoogleDocsActiveEditable() ??
    getGoogleDocsEventTarget() ??
    null
  );
};

const dispatchDocsInputEvent = (target: HTMLElement, value: string) => {
  try {
    target.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType: "insertReplacementText",
        data: value,
      }),
    );
    return;
  } catch {}

  try {
    target.dispatchEvent(
      new Event("input", {
        bubbles: true,
        composed: true,
      }),
    );
  } catch {}
};

const tryExecInsertTextOnHost = (commandTarget: HTMLElement, value: string) => {
  const ownerDocument = getDocsOwnerDocument(commandTarget);

  focusDocsTarget(commandTarget);

  try {
    const ok = ownerDocument.execCommand?.("insertText", false, value);
    if (ok) {
      dispatchDocsInputEvent(commandTarget, value);
      return true;
    }
  } catch {}

  try {
    const ok = document.execCommand?.("insertText", false, value);
    if (ok) {
      dispatchDocsInputEvent(commandTarget, value);
      return true;
    }
  } catch {}

  return false;
};

const writeTextToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

const clearDocsSelectionWithDelete = (commandTarget: HTMLElement) => {
  const ownerDocument = getDocsOwnerDocument(commandTarget);

  focusDocsTarget(commandTarget);

  try {
    const ok = ownerDocument.execCommand?.("delete", false);
    if (ok) return true;
  } catch {}

  try {
    const ok = document.execCommand?.("delete", false);
    if (ok) return true;
  } catch {}

  return false;
};

const tryExecPasteOnHost = async (commandTarget: HTMLElement) => {
  const ownerDocument = getDocsOwnerDocument(commandTarget);

  focusDocsTarget(commandTarget);

  try {
    const ok = ownerDocument.execCommand?.("paste", false);
    if (ok) return true;
  } catch {}

  try {
    const ok = document.execCommand?.("paste", false);
    if (ok) return true;
  } catch {}

  return false;
};

const verifyDocsReplaceResult = (
  compareTarget: HTMLElement,
  expected: string,
) => {
  const synced = syncGoogleDocsTextCache(compareTarget);
  const current = normalizeDocsComparableText(synced);
  const wanted = normalizeDocsComparableText(expected);

  return current === wanted;
};

export const replaceGoogleDocsText = async (value: string) => {
  const normalized = normalizeDocsCacheText(value);

  const commandTarget = getDocsCommandTarget();
  if (!commandTarget) return false;

  const compareTarget = commandTarget;

  const selected = selectAllDocsContent(commandTarget);
  if (!selected) return false;

  const inserted = tryExecInsertTextOnHost(commandTarget, normalized);

  if (inserted && verifyDocsReplaceResult(compareTarget, normalized)) {
    setGoogleDocsTextCache(normalized);
    scheduleGoogleDocsTextResync(compareTarget);
    return true;
  }

  const clipboardOk = await writeTextToClipboard(normalized);
  if (!clipboardOk) return false;

  const reselected = selectAllDocsContent(commandTarget);
  if (!reselected) return false;

  clearDocsSelectionWithDelete(commandTarget);

  const pasted = await tryExecPasteOnHost(commandTarget);

  if (pasted && verifyDocsReplaceResult(compareTarget, normalized)) {
    setGoogleDocsTextCache(normalized);
    scheduleGoogleDocsTextResync(compareTarget);
    return true;
  }

  return false;
};
