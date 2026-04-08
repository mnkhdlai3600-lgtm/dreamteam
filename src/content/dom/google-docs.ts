const DOCS_HOST = "docs.google.com";

const DOCS_PAGE_SELECTOR = ".kix-page-paginated, .kix-page-column, .kix-page";
const DOCS_CANVAS_SELECTOR = "canvas.kix-canvas-tile-content";
const DOCS_IFRAME_SELECTOR =
  ".docs-texteventtarget-iframe, iframe.docs-texteventtarget-iframe";

const DOCS_ROOT_SELECTORS = [
  ".docs-texteventtarget-div",
  '[role="textbox"][aria-multiline="true"]',
  '[aria-label="Document"][role="textbox"]',
  '[aria-label="Документ"][role="textbox"]',
  ".kix-editor-container",
  DOCS_PAGE_SELECTOR,
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

const isNodeElement = (value: unknown): value is Element => {
  return !!value && typeof value === "object" && (value as Node).nodeType === 1;
};

const isHtmlElementLike = (value: unknown): value is HTMLElement => {
  return (
    isNodeElement(value) &&
    typeof (value as HTMLElement).matches === "function" &&
    typeof (value as HTMLElement).closest === "function"
  );
};

const asHtmlElement = (value: unknown): HTMLElement | null => {
  return isHtmlElementLike(value) ? (value as HTMLElement) : null;
};

const queryHtmlElement = (root: ParentNode | null, selector: string) => {
  if (!root || typeof root.querySelector !== "function") return null;
  return asHtmlElement(root.querySelector(selector));
};

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

const isEditableDocsTarget = (el: HTMLElement | null): el is HTMLElement => {
  if (!el) return false;

  return (
    el.matches(DOCS_EVENT_TARGET_SELECTORS) ||
    el.isContentEditable ||
    el.getAttribute("role") === "textbox" ||
    el.getAttribute("contenteditable") === "true"
  );
};

const getVisibleDocsPages = () => {
  return Array.from(document.querySelectorAll<HTMLElement>(DOCS_PAGE_SELECTOR))
    .filter((page) => isVisibleDocsRect(page.getBoundingClientRect()))
    .sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      if (ar.top !== br.top) return ar.top - br.top;
      return ar.left - br.left;
    });
};

const readDocsTextFromPage = (page: HTMLElement | null) => {
  if (!page) return "";

  const nodes = Array.from(
    page.querySelectorAll<HTMLElement>(DOCS_TEXT_SELECTORS),
  );
  if (!nodes.length) return "";

  const raw = nodes
    .map((node) => node.innerText || node.textContent || "")
    .map((text) => normalizeDocsText(text))
    .filter(Boolean)
    .join("\n");

  return normalizeDocsText(raw);
};

const isPlainTypingKey = (key: string) => {
  if (key.length !== 1) return false;
  return !/[\u0000-\u001F]/.test(key);
};

const getTargetFromDoc = (doc: Document | null) => {
  if (!doc) return null;

  try {
    const direct = queryHtmlElement(doc, DOCS_EVENT_TARGET_SELECTORS);
    if (direct) return direct;

    const active = asHtmlElement(doc.activeElement);
    if (active) {
      const closest = asHtmlElement(
        active.closest(DOCS_EVENT_TARGET_SELECTORS),
      );
      if (closest) return closest;
      if (isEditableDocsTarget(active)) return active;
    }
  } catch {}

  return null;
};

const isElementInsideDocsIframe = (target: EventTarget | null) => {
  const el = asHtmlElement(target);
  if (!el) return false;

  const iframeDoc = getGoogleDocsIframeDocument();
  if (!iframeDoc) return false;

  return el.ownerDocument === iframeDoc;
};

const getDirectGoogleDocsEventTarget = (): HTMLElement | null => {
  const iframeDoc = getGoogleDocsIframeDocument();
  const iframeTarget = getTargetFromDoc(iframeDoc);
  if (iframeTarget) return iframeTarget;

  const mainTarget = getTargetFromDoc(document);
  if (mainTarget) return mainTarget;

  return null;
};

const getActiveDocsPage = (target?: EventTarget | null) => {
  const directPage = getGoogleDocsPage(target);
  if (directPage) return directPage;

  const visiblePages = getVisibleDocsPages();
  return visiblePages[0] ?? null;
};

export const isGoogleDocsSite = () => {
  const host = window.location.hostname;
  const path = window.location.pathname;
  return host.includes(DOCS_HOST) && path.includes("/document/");
};

export const getGoogleDocsIframe = (): HTMLIFrameElement | null => {
  const iframe = document.querySelector(DOCS_IFRAME_SELECTOR);
  return iframe instanceof HTMLIFrameElement ? iframe : null;
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
    return asHtmlElement(iframeDoc?.body);
  } catch {
    return null;
  }
};

export const getGoogleDocsEventTarget = (): HTMLElement | null => {
  const direct = getDirectGoogleDocsEventTarget();
  if (isEditableDocsTarget(direct)) return direct;

  const iframeBody = getGoogleDocsIframeBody();
  if (iframeBody) return iframeBody;

  return null;
};

export const getGoogleDocsCanvas = (
  target?: EventTarget | null,
): HTMLCanvasElement | null => {
  const targetEl = asHtmlElement(target);

  if (targetEl) {
    const page = asHtmlElement(targetEl.closest(DOCS_PAGE_SELECTOR));
    const localCanvas = page?.querySelector(DOCS_CANVAS_SELECTOR);
    if (localCanvas instanceof HTMLCanvasElement) return localCanvas;

    const closestCanvas = targetEl.closest(DOCS_CANVAS_SELECTOR);
    if (closestCanvas instanceof HTMLCanvasElement) return closestCanvas;
  }

  return document.querySelector<HTMLCanvasElement>(DOCS_CANVAS_SELECTOR);
};

export const getGoogleDocsPage = (
  target?: EventTarget | null,
): HTMLElement | null => {
  const targetEl = asHtmlElement(target);

  if (targetEl) {
    const page = asHtmlElement(targetEl.closest(DOCS_PAGE_SELECTOR));
    if (page) return page;
  }

  const selected = queryHtmlElement(document, DOCS_PAGE_SELECTOR);
  if (selected) return selected;

  const canvas = getGoogleDocsCanvas(target);
  return asHtmlElement(canvas?.closest(DOCS_PAGE_SELECTOR) ?? null);
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

  const targetEl = asHtmlElement(target);

  if (targetEl) {
    const closestEventTarget = asHtmlElement(
      targetEl.closest(DOCS_EVENT_TARGET_SELECTORS),
    );
    if (closestEventTarget) {
      return closestEventTarget;
    }

    if (isElementInsideDocsIframe(targetEl)) {
      return getGoogleDocsIframeBody();
    }

    const root = asHtmlElement(targetEl.closest(DOCS_ROOT_SELECTORS));
    if (root) return root;
  }

  return queryHtmlElement(document, DOCS_ROOT_SELECTORS);
};

export const resetGoogleDocsTextCache = () => {
  docsTextCache = "";
};

export const setGoogleDocsTextCache = (value: string) => {
  docsTextCache = normalizeDocsCacheText(value);
};

export const getGoogleDocsTextCache = () =>
  normalizeDocsCacheText(docsTextCache);

export const syncGoogleDocsTextCache = (target?: EventTarget | null) => {
  const activePage = getActiveDocsPage(target);
  const fromPage = readDocsTextFromPage(activePage);

  if (fromPage) {
    docsTextCache = fromPage;
    return docsTextCache;
  }

  return normalizeDocsCacheText(docsTextCache);
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

  if (key === "Tab" || key === " ") {
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
  const activePage = getActiveDocsPage();
  const fromPage = readDocsTextFromPage(activePage);

  if (fromPage) {
    docsTextCache = fromPage;
    return docsTextCache;
  }

  return normalizeDocsCacheText(docsTextCache);
};

export const resolveGoogleDocsActiveEditable = (): HTMLElement | null => {
  const direct = getDirectGoogleDocsEventTarget();
  if (direct) return direct;

  const iframeDoc = getGoogleDocsIframeDocument();
  const iframeActive = asHtmlElement(iframeDoc?.activeElement);
  if (iframeActive) {
    const closest = asHtmlElement(
      iframeActive.closest(DOCS_EVENT_TARGET_SELECTORS),
    );
    if (closest) return closest;
    return getGoogleDocsIframeBody();
  }

  const active = asHtmlElement(document.activeElement);
  if (active) {
    const closest = asHtmlElement(active.closest(DOCS_EVENT_TARGET_SELECTORS));
    if (closest) return closest;
  }

  const iframeBody = getGoogleDocsIframeBody();
  if (iframeBody) return iframeBody;

  return null;
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
  if (!isVisibleDocsRect(rect)) return null;

  return new DOMRect(
    rect.right || rect.left,
    rect.top,
    1,
    Math.max(1, rect.height),
  );
};

export const replaceGoogleDocsText = (value: string) => {
  const normalized = normalizeDocsCacheText(value);
  const target = resolveGoogleDocsActiveEditable();

  console.log("[болор][docs-replace] target-check", {
    target,
    normalized,
    activeElement: document.activeElement,
  });

  if (!target) {
    console.log("[болор][docs-replace] no-editable-target");
    return false;
  }

  setGoogleDocsTextCache(normalized);
  return false;
};
