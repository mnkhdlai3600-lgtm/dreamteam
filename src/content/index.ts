console.log("Bolor AI content script loaded v15");

const INDICATOR_ID = "bolor-ai-indicator";
const DEFAULT_ACCENT = "#8b5cf6";

let activeElement: HTMLElement | null = null;
let debounceTimer: number | null = null;
let latestSuggestion: string | null = null;

let isApplyingSuggestion = false;
let isApplyingHotkey = false;
let messengerReplaceInProgress = false;
let lastAppliedText: string | null = null;
let lastCheckedText = "";
let suppressInputUntil = 0;
let requestCounter = 0;
let isComposing = false;

type CheckResponse = {
  success: boolean;
  data?: {
    original: string;
    corrected: string;
    changed: boolean;
    suggestions: string[];
    mode: "openai-galig" | "bolor-suggest" | "none";
  };
  error?: string;
};

const isMessengerSite = () => {
  const host = window.location.hostname;
  return host.includes("messenger.com") || host.includes("facebook.com");
};

const removeIndicator = () => {
  const existing = document.getElementById(INDICATOR_ID);
  if (existing) existing.remove();
};

const isValidHexColor = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
  );
};

const getAccentColor = async (): Promise<string> => {
  try {
    const result = await chrome.storage.local.get(["accentColor"]);
    const savedAccent = result.accentColor;

    if (isValidHexColor(savedAccent)) {
      return savedAccent;
    }

    return DEFAULT_ACCENT;
  } catch (error) {
    console.error("Failed to load accent color:", error);
    return DEFAULT_ACCENT;
  }
};

const applyAccentColorToRoot = (color: string) => {
  document.documentElement.style.setProperty("--bolor-accent", color);
};

const applyInitialAccentColor = async () => {
  const accentColor = await getAccentColor();
  applyAccentColorToRoot(accentColor);
};

const watchAccentColorChanges = () => {
  if (!chrome?.storage?.onChanged) return;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (!changes.accentColor) return;

    const nextColor = isValidHexColor(changes.accentColor.newValue)
      ? changes.accentColor.newValue
      : DEFAULT_ACCENT;

    applyAccentColorToRoot(nextColor);

    const indicator = document.getElementById(
      INDICATOR_ID,
    ) as HTMLDivElement | null;
    if (indicator) {
      indicator.style.background = nextColor;
    }
  });
};

const createIndicator = async (
  target: HTMLElement,
  text = "Bolor AI идэвхтэй",
) => {
  removeIndicator();

  const rect = target.getBoundingClientRect();
  const accentColor = await getAccentColor();

  const div = document.createElement("div");
  div.id = INDICATOR_ID;
  div.textContent = text;
  div.style.position = "fixed";
  div.style.zIndex = "999999";
  div.style.padding = "10px 14px";
  div.style.borderRadius = "12px";
  div.style.background = accentColor;
  div.style.color = "#ffffff";
  div.style.fontSize = "13px";
  div.style.fontFamily = "Arial, sans-serif";
  div.style.boxShadow = "0 10px 24px rgba(0,0,0,0.22)";
  div.style.maxWidth = "320px";
  div.style.whiteSpace = "nowrap";
  div.style.overflow = "hidden";
  div.style.textOverflow = "ellipsis";
  div.style.pointerEvents = "none";
  div.style.lineHeight = "1.3";

  document.body.appendChild(div);

  const spacing = 10;
  const popupHeight = div.offsetHeight;
  const popupWidth = div.offsetWidth;

  let top = rect.bottom + spacing;
  let left = rect.left + rect.width / 2 - popupWidth / 2;

  if (top + popupHeight > window.innerHeight - 8) {
    top = rect.top - popupHeight - spacing;
  }

  if (top < 8) top = 8;

  if (left + popupWidth > window.innerWidth - 8) {
    left = window.innerWidth - popupWidth - 8;
  }

  if (left < 8) left = 8;

  div.style.top = `${top}px`;
  div.style.left = `${left}px`;
};

const isEditableElement = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;

  if (el instanceof HTMLTextAreaElement) return true;

  if (el instanceof HTMLInputElement) {
    const allowedTypes = ["text", "search", "email", "url", "tel"];
    return allowedTypes.includes(el.type);
  }

  if (el.isContentEditable) return true;
  if (el.getAttribute("role") === "textbox") return true;

  return false;
};

const getMessengerEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  const root = target.closest(
    [
      '[contenteditable="true"][role="textbox"]',
      '[role="textbox"][contenteditable="true"]',
      '[contenteditable="true"][data-lexical-editor="true"]',
      '[data-lexical-editor="true"][contenteditable="true"]',
      '[aria-label][contenteditable="true"][role="textbox"]',
    ].join(","),
  );

  return root instanceof HTMLElement ? root : null;
};

const getEditableElement = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  if (isMessengerSite()) {
    const messengerEditor = getMessengerEditorRoot(target);
    if (messengerEditor) return messengerEditor;
  }

  if (isEditableElement(target)) return target;

  const closestEditable = target.closest(
    [
      "textarea",
      'input[type="text"]',
      'input[type="search"]',
      'input[type="email"]',
      'input[type="url"]',
      'input[type="tel"]',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ].join(","),
  );

  return closestEditable instanceof HTMLElement ? closestEditable : null;
};

const getEventEditableTarget = (event: Event): HTMLElement | null => {
  if (typeof event.composedPath === "function") {
    const path = event.composedPath();

    for (const item of path) {
      const editable = getEditableElement(item);
      if (editable) return editable;
    }
  }

  return getEditableElement(event.target);
};

const normalizeText = (text: string) =>
  text
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();

const getElementText = (el: HTMLElement): string => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }

  if (el.isContentEditable || el.getAttribute("role") === "textbox") {
    return normalizeText(el.innerText || el.textContent || "");
  }

  return "";
};

const setNativeValue = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
};

const placeCursorAtEnd = (el: HTMLElement) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const len = el.value.length;
    el.setSelectionRange?.(len, len);
    return;
  }

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const dispatchSyntheticInput = (
  el: HTMLElement,
  inputType: string,
  data: string | null,
) => {
  try {
    el.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType,
        data,
      }),
    );
  } catch {}

  try {
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType,
        data,
      }),
    );
  } catch {}
};

const createFragmentFromText = (value: string) => {
  const fragment = document.createDocumentFragment();
  const lines = value.split("\n");

  lines.forEach((line, index) => {
    if (index > 0) {
      fragment.appendChild(document.createElement("br"));
    }
    fragment.appendChild(document.createTextNode(line));
  });

  return fragment;
};

const verifyElementText = (el: HTMLElement, expected: string) => {
  const current = normalizeText(getElementText(el)).replace(/\s+/g, " ");
  const wanted = normalizeText(expected).replace(/\s+/g, " ");
  return current === wanted;
};

const resolveActiveEditable = (): HTMLElement | null => {
  const current = document.activeElement;
  if (current) {
    const editable = getEditableElement(current);
    if (editable) return editable;
  }

  const selection = window.getSelection();
  if (selection?.anchorNode) {
    const node =
      selection.anchorNode instanceof Element
        ? selection.anchorNode
        : selection.anchorNode.parentElement;

    const editable = getEditableElement(node);
    if (editable) return editable;
  }

  return activeElement;
};

const replaceMessengerText = (inputEl: HTMLElement, value: string) => {
  const el = getMessengerEditorRoot(inputEl) ?? inputEl;
  el.focus();

  messengerReplaceInProgress = true;
  suppressInputUntil = Date.now() + 3000;
  isApplyingSuggestion = true;

  try {
    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);

    let ok = false;

    try {
      ok = document.execCommand("insertText", false, value);
    } catch {
      ok = false;
    }

    placeCursorAtEnd(el);

    return ok || verifyElementText(el, value);
  } catch (error) {
    console.error("replaceMessengerText error:", error);
    return false;
  } finally {
    window.setTimeout(() => {
      messengerReplaceInProgress = false;
      isApplyingSuggestion = false;
    }, 700);
  }
};

const replaceNormalContentEditableText = (el: HTMLElement, value: string) => {
  el.focus();

  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }

  el.appendChild(createFragmentFromText(value));
  placeCursorAtEnd(el);
  dispatchSyntheticInput(el, "insertReplacementText", value);

  return true;
};

const setElementText = (el: HTMLElement, value: string) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus();
    setNativeValue(el, value);
    el.setSelectionRange?.(value.length, value.length);

    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType: "insertReplacementText",
        data: value,
      }),
    );

    return true;
  }

  if (el.isContentEditable || el.getAttribute("role") === "textbox") {
    if (isMessengerSite()) {
      return replaceMessengerText(el, value);
    }

    return replaceNormalContentEditableText(el, value);
  }

  return false;
};

const checkWithBackground = async (text: string) => {
  return new Promise<CheckResponse>((resolve, reject) => {
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      typeof chrome.runtime.sendMessage !== "function"
    ) {
      reject(
        new Error(
          "Extension context old or unavailable. Tab-aa refresh hiine uu.",
        ),
      );
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: "CHECK_TEXT",
        payload: { text },
      },
      (response: CheckResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(response);
      },
    );
  });
};

const clearSuggestion = () => {
  latestSuggestion = null;
};

const checkText = async (text: string) => {
  const trimmed = text.trim();

  if (!trimmed) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  if (lastAppliedText && trimmed === lastAppliedText.trim()) {
    clearSuggestion();
    return;
  }

  const currentRequestId = ++requestCounter;

  try {
    const response = await checkWithBackground(trimmed);

    if (currentRequestId !== requestCounter) return;
    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Check failed");
    }

    const data = response.data;
    if (!activeElement) return;

    const corrected = (data.corrected || "").trim();
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

    const hasLatin = /[a-zA-Z]/.test(trimmed);
    const firstSuggestion = suggestions[0]?.trim() || "";

    const finalSuggestion =
      corrected && corrected !== trimmed
        ? corrected
        : firstSuggestion && firstSuggestion !== trimmed
          ? firstSuggestion
          : "";

    const shouldSuggest =
      !!finalSuggestion && (data.changed || hasLatin || suggestions.length > 0);

    if (shouldSuggest) {
      latestSuggestion = finalSuggestion;

      if (data.mode === "openai-galig" || hasLatin) {
        void createIndicator(
          activeElement,
          `Option+Space дарж кирилл болгоно: ${finalSuggestion}`,
        );
      } else {
        void createIndicator(
          activeElement,
          `Option+Space дарж засна: ${finalSuggestion}`,
        );
      }
    } else {
      clearSuggestion();
      removeIndicator();
    }
  } catch (error) {
    if (currentRequestId !== requestCounter) return;

    clearSuggestion();

    if (activeElement) {
      void createIndicator(
        activeElement,
        error instanceof Error ? error.message : "Холболтын алдаа",
      );
    }
  }
};

const handleInput = () => {
  if (!activeElement) return;
  if (isApplyingSuggestion) return;
  if (messengerReplaceInProgress) return;
  if (isComposing) return;
  if (Date.now() < suppressInputUntil) return;

  const text = getElementText(activeElement).trim();

  if (!text) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  if (lastAppliedText && text === lastAppliedText.trim()) return;
  if (text === lastCheckedText) return;

  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    if (!activeElement) return;
    if (isApplyingSuggestion) return;
    if (messengerReplaceInProgress) return;
    if (isComposing) return;
    if (Date.now() < suppressInputUntil) return;

    const latestText = getElementText(activeElement).trim();

    if (!latestText) {
      clearSuggestion();
      removeIndicator();
      return;
    }

    if (lastAppliedText && latestText === lastAppliedText.trim()) return;
    if (latestText === lastCheckedText) return;

    lastCheckedText = latestText;
    void checkText(latestText);
  }, 700);
};

const applySuggestion = () => {
  const resolved = resolveActiveEditable();
  if (!resolved || !latestSuggestion) return;
  if (isApplyingHotkey) return;
  if (messengerReplaceInProgress) return;
  if (isComposing) return;

  activeElement = resolved;

  const currentText = getElementText(activeElement).trim();
  if (!currentText) return;

  isApplyingHotkey = true;

  const suggestion = latestSuggestion;
  latestSuggestion = null;

  suppressInputUntil = Date.now() + 3000;
  isApplyingSuggestion = true;

  try {
    const ok = setElementText(activeElement, suggestion);

    if (!ok && activeElement) {
      void createIndicator(activeElement, "Replace амжилтгүй");
      return;
    }

    lastAppliedText = suggestion;
    lastCheckedText = suggestion.trim();

    window.setTimeout(() => {
      if (activeElement && verifyElementText(activeElement, suggestion)) {
        void createIndicator(activeElement, "Засвар хэрэглэгдлээ");
      } else if (activeElement) {
        void createIndicator(activeElement, "Replace амжилтгүй");
      }
    }, 120);
  } finally {
    window.setTimeout(() => {
      isApplyingSuggestion = false;
    }, 700);

    window.setTimeout(() => {
      isApplyingHotkey = false;
    }, 400);
  }
};

document.addEventListener(
  "compositionstart",
  () => {
    isComposing = true;
  },
  true,
);

document.addEventListener(
  "compositionend",
  () => {
    isComposing = false;
  },
  true,
);

document.addEventListener(
  "focusin",
  (event) => {
    const target = getEventEditableTarget(event);
    if (!target) return;

    activeElement = target;
    void createIndicator(target);
  },
  true,
);

document.addEventListener(
  "input",
  (event) => {
    if (isApplyingSuggestion) return;
    if (messengerReplaceInProgress) return;
    if (isComposing) return;
    if (Date.now() < suppressInputUntil) return;

    const target = getEventEditableTarget(event);
    if (!target) return;

    activeElement = target;
    handleInput();
  },
  true,
);

document.addEventListener(
  "keyup",
  (event) => {
    if (isMessengerSite()) return;
    if (isApplyingSuggestion) return;
    if (messengerReplaceInProgress) return;
    if (isComposing) return;
    if (Date.now() < suppressInputUntil) return;

    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.altKey && keyboardEvent.code === "Space") return;

    const target = getEventEditableTarget(event);
    if (!target) return;

    activeElement = target;
    handleInput();
  },
  true,
);

document.addEventListener(
  "paste",
  (event) => {
    if (isApplyingSuggestion) return;
    if (messengerReplaceInProgress) return;
    if (isComposing) return;
    if (Date.now() < suppressInputUntil) return;

    const target = getEventEditableTarget(event);
    if (!target) return;

    activeElement = target;

    window.setTimeout(() => {
      handleInput();
    }, 50);
  },
  true,
);

document.addEventListener(
  "keydown",
  (event) => {
    if (!(event.altKey && event.code === "Space")) return;
    if (event.repeat) return;
    if (isApplyingHotkey) return;
    if (messengerReplaceInProgress) return;
    if (isComposing) return;
    if (!latestSuggestion) return;

    const resolved = resolveActiveEditable();
    if (!resolved) return;

    activeElement = resolved;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    applySuggestion();
  },
  true,
);

document.addEventListener(
  "focusout",
  () => {
    window.setTimeout(() => {
      const current = document.activeElement;
      const editable = getEditableElement(current);

      if (!editable) {
        activeElement = null;
        clearSuggestion();
        removeIndicator();
      }
    }, 100);
  },
  true,
);

void applyInitialAccentColor();
watchAccentColorChanges();

console.log("NEW MESSENGER FIX LOADED v15");
