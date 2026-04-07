const DOCS_HOST = "docs.google.com";

const DOCS_PAGE_SELECTOR = ".kix-page-paginated, .kix-page-column, .kix-page";
const DOCS_CANVAS_SELECTOR = "canvas.kix-canvas-tile-content";
const DOCS_IFRAME_SELECTOR =
  ".docs-texteventtarget-iframe, iframe.docs-texteventtarget-iframe";

const DOCS_ROOT_SELECTORS = [
  DOCS_PAGE_SELECTOR,
  ".kix-appview-editor",
  ".kix-editor-container",
  ".docs-texteventtarget-div",
  '[role="textbox"][aria-multiline="true"]',
  '[aria-label="Document"][role="textbox"]',
  '[aria-label="Документ"][role="textbox"]',
].join(",");

const DOCS_TEXT_SELECTORS = [
  ".kix-wordhtmlgenerator-word-node",
  ".kix-lineview-text-block",
  ".kix-lineview-content",
].join(",");

const DOCS_CURSOR_SELECTORS = [
  ".kix-cursor",
  ".kix-cursor-caret",
  ".kix-cursor > div",
  ".docs-text-ui-cursor-blink",
  ".docs-text-ui-cursor",
].join(",");

const DOCS_EVENT_TARGET_SELECTORS = [
  ".docs-texteventtarget-div",
  '[contenteditable="true"][role="textbox"]',
  '[aria-label="Document"][role="textbox"]',
  '[aria-label="Документ"][role="textbox"]',
].join(",");

let docsTextCache = "";

const stripInvisibleDocsChars = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "");

const normalizeDocsText = (value: string) =>
  stripInvisibleDocsChars(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const normalizeDocsCacheText = (value: string) =>
  stripInvisibleDocsChars(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ");

const isVisibleDocsRect = (rect: DOMRect | null) => {
  return (
    !!rect &&
    Number.isFinite(rect.left) &&
    Number.isFinite(rect.top) &&
    rect.height > 0 &&
    rect.left >= -20 &&
    rect.top >= -20 &&
    rect.left <= window.innerWidth + 20 &&
    rect.top <= window.innerHeight + 20
  );
};

export const isGoogleDocsSite = () => {
  const host = window.location.hostname;
  const path = window.location.pathname;
  return host.includes(DOCS_HOST) && path.includes("/document/");
};

export const getGoogleDocsIframe = (): HTMLIFrameElement | null => {
  return document.querySelector<HTMLIFrameElement>(DOCS_IFRAME_SELECTOR);
};

export const getGoogleDocsIframeDocument = (): Document | null => {
  const iframe = getGoogleDocsIframe();
  if (!iframe) return null;

  try {
    return iframe.contentDocument ?? null;
  } catch {
    return null;
  }
};

export const getGoogleDocsIframeBody = (): HTMLElement | null => {
  const iframeDoc = getGoogleDocsIframeDocument();

  try {
    const body = iframeDoc?.body;
    return body instanceof HTMLElement ? body : null;
  } catch {
    return null;
  }
};

export const getGoogleDocsEventTarget = (): HTMLElement | null => {
  const iframeBody = getGoogleDocsIframeBody();
  if (iframeBody) return iframeBody;

  const direct = document.querySelector<HTMLElement>(
    DOCS_EVENT_TARGET_SELECTORS,
  );
  if (direct) return direct;

  return null;
};

export const getGoogleDocsCanvas = (
  target?: EventTarget | null,
): HTMLCanvasElement | null => {
  if (target instanceof Element) {
    const localCanvas = target
      .closest(DOCS_PAGE_SELECTOR)
      ?.querySelector(DOCS_CANVAS_SELECTOR);

    if (localCanvas instanceof HTMLCanvasElement) return localCanvas;

    const closestCanvas = target.closest(DOCS_CANVAS_SELECTOR);
    if (closestCanvas instanceof HTMLCanvasElement) return closestCanvas;
  }

  return document.querySelector<HTMLCanvasElement>(DOCS_CANVAS_SELECTOR);
};

export const getGoogleDocsPage = (
  target?: EventTarget | null,
): HTMLElement | null => {
  if (target instanceof Element) {
    const page = target.closest(DOCS_PAGE_SELECTOR);
    if (page instanceof HTMLElement) return page;
  }

  const eventTarget = getGoogleDocsEventTarget();
  if (eventTarget) {
    const page = eventTarget.closest(DOCS_PAGE_SELECTOR);
    if (page instanceof HTMLElement) return page;
  }

  const selected = document.querySelector<HTMLElement>(DOCS_PAGE_SELECTOR);
  if (selected) return selected;

  const canvas = getGoogleDocsCanvas(target);
  return canvas?.closest(DOCS_PAGE_SELECTOR) as HTMLElement | null;
};

export const getGoogleDocsEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  const eventTarget = getGoogleDocsEventTarget();
  if (eventTarget) return eventTarget;

  if (target instanceof HTMLIFrameElement) {
    const iframeBody = getGoogleDocsIframeBody();
    if (iframeBody) return iframeBody;
  }

  if (target instanceof Element) {
    const closestEventTarget = target.closest(DOCS_EVENT_TARGET_SELECTORS);
    if (closestEventTarget instanceof HTMLElement) {
      return closestEventTarget;
    }

    const root = target.closest(DOCS_ROOT_SELECTORS);
    if (root instanceof HTMLElement) return root;
  }

  return document.querySelector<HTMLElement>(DOCS_ROOT_SELECTORS);
};

const readDocsTextFromNodes = () => {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(DOCS_TEXT_SELECTORS),
  );

  if (!nodes.length) return "";

  const raw = nodes
    .map((node) => node.innerText || node.textContent || "")
    .filter((part) => !!part)
    .join("\n");

  return normalizeDocsText(raw);
};

const readDocsTextFromIframe = () => {
  const doc = getGoogleDocsIframeDocument();
  if (!doc) return "";

  try {
    return normalizeDocsText(
      doc.body?.innerText ?? doc.body?.textContent ?? "",
    );
  } catch {
    return "";
  }
};

const isPlainTypingKey = (key: string) => {
  if (key.length !== 1) return false;
  return !/[\u0000-\u001F]/.test(key);
};

export const resetGoogleDocsTextCache = () => {
  docsTextCache = "";
};

export const setGoogleDocsTextCache = (value: string) => {
  docsTextCache = normalizeDocsCacheText(value);
};

export const syncGoogleDocsTextCache = (target?: EventTarget | null) => {
  const fromIframe = readDocsTextFromIframe();
  if (fromIframe) {
    docsTextCache = fromIframe;
    return docsTextCache;
  }

  const fromNodes = readDocsTextFromNodes();
  if (fromNodes) {
    docsTextCache = fromNodes;
    return docsTextCache;
  }

  if (target instanceof Element) {
    const text = normalizeDocsCacheText(
      (target as HTMLElement).innerText || target.textContent || "",
    );

    if (text) {
      docsTextCache = text;
      return docsTextCache;
    }
  }

  return docsTextCache;
};

export const updateGoogleDocsTextCacheFromKeyboardEvent = (
  event: KeyboardEvent,
) => {
  const key = event.key;

  if (key === "Backspace") {
    docsTextCache = docsTextCache.slice(0, -1);
    return docsTextCache;
  }

  if (key === "Enter") {
    docsTextCache += "\n";
    docsTextCache = normalizeDocsCacheText(docsTextCache);
    return docsTextCache;
  }

  if (key === "Tab") {
    docsTextCache += " ";
    docsTextCache = normalizeDocsCacheText(docsTextCache);
    return docsTextCache;
  }

  if (key === " ") {
    docsTextCache += " ";
    docsTextCache = normalizeDocsCacheText(docsTextCache);
    return docsTextCache;
  }

  if (isPlainTypingKey(key)) {
    docsTextCache += key;
    docsTextCache = normalizeDocsCacheText(docsTextCache);
    return docsTextCache;
  }

  return docsTextCache;
};

export const getGoogleDocsText = () => {
  const fromIframe = readDocsTextFromIframe();
  if (fromIframe) {
    docsTextCache = fromIframe;
    return docsTextCache;
  }

  const fromNodes = readDocsTextFromNodes();
  if (fromNodes) {
    docsTextCache = fromNodes;
    return docsTextCache;
  }

  return normalizeDocsCacheText(docsTextCache);
};

export const resolveGoogleDocsActiveEditable = (): HTMLElement | null => {
  const eventTarget = getGoogleDocsEventTarget();
  if (eventTarget) return eventTarget;

  const active = document.activeElement;

  if (active instanceof HTMLIFrameElement) {
    const iframeBody = getGoogleDocsIframeBody();
    if (iframeBody) return iframeBody;
  }

  if (active instanceof HTMLElement) {
    const closestEventTarget = active.closest(DOCS_EVENT_TARGET_SELECTORS);
    if (closestEventTarget instanceof HTMLElement) {
      return closestEventTarget;
    }

    const closestRoot = active.closest(DOCS_ROOT_SELECTORS);
    if (closestRoot instanceof HTMLElement) return closestRoot;
  }

  return document.querySelector<HTMLElement>(DOCS_ROOT_SELECTORS);
};

export const getGoogleDocsCursorElement = (): HTMLElement | null => {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(DOCS_CURSOR_SELECTORS),
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    return (
      isVisibleDocsRect(rect) &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  });

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    if (br.top !== ar.top) return br.top - ar.top;
    return br.left - ar.left;
  });

  return candidates[0] ?? null;
};

export const getGoogleDocsCursorRect = (): DOMRect | null => {
  const cursor = getGoogleDocsCursorElement();
  if (!cursor) return null;

  const rect = cursor.getBoundingClientRect();
  if (!isVisibleDocsRect(rect)) {
    return null;
  }

  return new DOMRect(
    rect.right || rect.left,
    rect.top,
    1,
    Math.max(1, rect.height),
  );
};
