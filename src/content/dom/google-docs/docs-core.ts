const DOCS_HOST = "docs.google.com";

export const DOCS_PAGE_SELECTOR = ".kix-page-paginated, .kix-page";
export const DOCS_CANVAS_SELECTOR = "canvas.kix-canvas-tile-content";
export const DOCS_IFRAME_SELECTOR =
  ".docs-texteventtarget-iframe, iframe.docs-texteventtarget-iframe";

export const DOCS_ROOT_SELECTORS = [
  ".docs-texteventtarget-div",
  '[role="textbox"][aria-multiline="true"]',
  '[aria-label="Document"][role="textbox"]',
  '[aria-label="Документ"][role="textbox"]',
  ".kix-editor-container",
  DOCS_PAGE_SELECTOR,
].join(",");

export const DOCS_TEXT_SELECTORS = [".kix-wordhtmlgenerator-word-node"].join(
  ",",
);

export const DOCS_CURSOR_SELECTORS = [
  ".kix-cursor",
  ".kix-cursor-caret",
  ".kix-cursor > div",
  ".docs-text-ui-cursor-blink",
  ".docs-text-ui-cursor",
].join(",");

export const DOCS_EVENT_TARGET_SELECTORS = [
  ".docs-texteventtarget-div",
  '[contenteditable="true"][role="textbox"]',
  '[aria-label="Document"][role="textbox"]',
  '[aria-label="Документ"][role="textbox"]',
].join(",");

export const isNodeElement = (value: unknown): value is Element => {
  return !!value && typeof value === "object" && (value as Node).nodeType === 1;
};

export const isHtmlElementLike = (value: unknown): value is HTMLElement => {
  return (
    isNodeElement(value) &&
    typeof (value as HTMLElement).matches === "function" &&
    typeof (value as HTMLElement).closest === "function"
  );
};

export const asHtmlElement = (value: unknown): HTMLElement | null => {
  return isHtmlElementLike(value) ? (value as HTMLElement) : null;
};

export const queryHtmlElement = (root: ParentNode | null, selector: string) => {
  if (!root || typeof root.querySelector !== "function") return null;
  return asHtmlElement(root.querySelector(selector));
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

export const isVisibleDocsRect = (rect: DOMRect | null) => {
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

const pageHasDocsContent = (page: HTMLElement | null) => {
  if (!page) return false;

  if (page.querySelector(DOCS_TEXT_SELECTORS)) return true;
  if (page.querySelector(DOCS_CANVAS_SELECTOR)) return true;
  if ((page.innerText || page.textContent || "").trim()) return true;

  return false;
};

const getDocsSearchDocuments = () => {
  const docs: Document[] = [];
  const iframeDoc = getGoogleDocsIframeDocument();

  if (iframeDoc) docs.push(iframeDoc);
  docs.push(document);

  return docs;
};

export const isEditableDocsTarget = (
  el: HTMLElement | null,
): el is HTMLElement => {
  if (!el) return false;

  return (
    el.matches(DOCS_EVENT_TARGET_SELECTORS) ||
    el.isContentEditable ||
    el.getAttribute("role") === "textbox" ||
    el.getAttribute("contenteditable") === "true"
  );
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

  for (const doc of getDocsSearchDocuments()) {
    const canvas = doc.querySelector(DOCS_CANVAS_SELECTOR);
    if (canvas instanceof HTMLCanvasElement) return canvas;
  }

  return null;
};

const getBestVisibleDocsPageFromDoc = (doc: Document) => {
  const pages = Array.from(
    doc.querySelectorAll<HTMLElement>(DOCS_PAGE_SELECTOR),
  ).filter((page) => {
    return (
      isVisibleDocsRect(page.getBoundingClientRect()) &&
      pageHasDocsContent(page)
    );
  });

  if (!pages.length) return null;

  pages.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    if (ar.top !== br.top) return ar.top - br.top;
    return ar.left - br.left;
  });

  return pages[0] ?? null;
};

export const getGoogleDocsPage = (
  target?: EventTarget | null,
): HTMLElement | null => {
  const targetEl = asHtmlElement(target);

  if (targetEl) {
    const page = asHtmlElement(targetEl.closest(DOCS_PAGE_SELECTOR));
    if (page && pageHasDocsContent(page)) return page;
  }

  for (const doc of getDocsSearchDocuments()) {
    const page = getBestVisibleDocsPageFromDoc(doc);
    if (page) return page;
  }

  const canvas = getGoogleDocsCanvas(target);
  const canvasPage = asHtmlElement(canvas?.closest(DOCS_PAGE_SELECTOR) ?? null);
  if (canvasPage && pageHasDocsContent(canvasPage)) return canvasPage;

  return null;
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
    if (closestEventTarget) return closestEventTarget;

    if (isElementInsideDocsIframe(targetEl)) {
      return getGoogleDocsIframeBody();
    }

    const root = asHtmlElement(targetEl.closest(DOCS_ROOT_SELECTORS));
    if (root) return root;
  }

  for (const doc of getDocsSearchDocuments()) {
    const root = queryHtmlElement(doc, DOCS_ROOT_SELECTORS);
    if (root) return root;
  }

  return null;
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
