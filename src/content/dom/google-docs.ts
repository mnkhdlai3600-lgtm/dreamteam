const DOCS_HOST = "docs.google.com";

const DOCS_ROOT_SELECTORS = [
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

export const isGoogleDocsSite = () => {
  const host = window.location.hostname;
  const path = window.location.pathname;
  return host.includes(DOCS_HOST) && path.includes("/document/");
};

export const getGoogleDocsEditorRoot = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) return null;

  const root = target.closest(DOCS_ROOT_SELECTORS);
  if (root instanceof HTMLElement) return root;

  if (target instanceof HTMLIFrameElement) {
    return target;
  }

  return null;
};

const readDocsTextFromNodes = () => {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(DOCS_TEXT_SELECTORS),
  );

  const parts = nodes
    .map((node) => node.innerText || node.textContent || "")
    .map((value) => value.replace(/\u00A0/g, " ").trim())
    .filter(Boolean);

  return parts.join("\n");
};

const readDocsTextFromIframe = () => {
  const iframe = document.querySelector<HTMLIFrameElement>(
    ".docs-texteventtarget-iframe",
  );

  if (!iframe) return "";

  try {
    const text = iframe.contentDocument?.body?.innerText ?? "";
    return text.replace(/\u00A0/g, " ").trim();
  } catch {
    return "";
  }
};

export const getGoogleDocsText = () => {
  const fromNodes = readDocsTextFromNodes();
  if (fromNodes) return fromNodes;

  const fromIframe = readDocsTextFromIframe();
  if (fromIframe) return fromIframe;

  return "";
};

export const resolveGoogleDocsActiveEditable = () => {
  const active = document.activeElement;

  if (active instanceof HTMLIFrameElement) {
    return active;
  }

  const fromActive = active
    ? document.querySelector<HTMLElement>(DOCS_ROOT_SELECTORS)
    : null;

  if (fromActive) return fromActive;

  return document.querySelector<HTMLElement>(DOCS_ROOT_SELECTORS);
};
