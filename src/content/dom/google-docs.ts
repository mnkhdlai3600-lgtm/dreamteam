const DOCS_HOST = "docs.google.com";

const DOCS_PAGE_SELECTOR = ".kix-page-paginated, .kix-page-column, .kix-page";
const DOCS_CANVAS_SELECTOR = "canvas.kix-canvas-tile-content";
const DOCS_IFRAME_SELECTOR =
  ".docs-texteventtarget-iframe, iframe.docs-texteventtarget-iframe";

const DOCS_ROOT_SELECTORS = [
  DOCS_PAGE_SELECTOR,
  ".kix-appview-editor",
  ".kix-editor-container",
  ".docs-texteventtarget-iframe",
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

  const selected = document.querySelector<HTMLElement>(DOCS_PAGE_SELECTOR);
  if (selected) return selected;

  const canvas = getGoogleDocsCanvas(target);
  return canvas?.closest(DOCS_PAGE_SELECTOR) as HTMLElement | null;
};

export const getGoogleDocsEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  const page = getGoogleDocsPage(target);
  if (page) return page;

  if (target instanceof Element) {
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

export const resolveGoogleDocsActiveEditable = () => {
  const active = document.activeElement;

  if (active instanceof HTMLIFrameElement) {
    return getGoogleDocsPage(active) ?? null;
  }

  const pageFromActive = getGoogleDocsPage(active);
  if (pageFromActive) return pageFromActive;

  return (
    getGoogleDocsPage() ??
    document.querySelector<HTMLElement>(DOCS_ROOT_SELECTORS)
  );
};
