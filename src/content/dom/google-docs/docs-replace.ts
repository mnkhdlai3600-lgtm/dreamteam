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

const getDocsCommandTargets = (preferred: HTMLElement) => {
  const candidates = [
    preferred,
    getGoogleDocsEventTarget(),
    getGoogleDocsIframeBody(),
  ].filter(Boolean) as HTMLElement[];

  const unique: HTMLElement[] = [];

  for (const item of candidates) {
    if (!unique.includes(item)) unique.push(item);
  }

  return unique;
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

  const visualTarget =
    resolveGoogleDocsActiveEditable() ??
    getGoogleDocsEventTarget() ??
    getGoogleDocsIframeBody();

  if (!visualTarget) return false;

  const selected = selectAllDocsContent(visualTarget);
  if (!selected) return false;

  const commandTargets = getDocsCommandTargets(visualTarget);

  for (const commandTarget of commandTargets) {
    const inserted = tryExecInsertTextOnHost(commandTarget, normalized);
    if (!inserted) continue;

    if (verifyDocsReplaceResult(visualTarget, normalized)) {
      setGoogleDocsTextCache(normalized);
      scheduleGoogleDocsTextResync(visualTarget);
      return true;
    }
  }

  const clipboardOk = await writeTextToClipboard(normalized);
  if (!clipboardOk) return false;

  const reselected = selectAllDocsContent(visualTarget);
  if (!reselected) return false;

  for (const commandTarget of commandTargets) {
    clearDocsSelectionWithDelete(commandTarget);

    const pasted = await tryExecPasteOnHost(commandTarget);
    if (!pasted) continue;

    if (verifyDocsReplaceResult(visualTarget, normalized)) {
      setGoogleDocsTextCache(normalized);
      scheduleGoogleDocsTextResync(visualTarget);
      return true;
    }
  }

  return false;
};
