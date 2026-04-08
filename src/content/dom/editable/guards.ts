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

export const isTextInputType = (type: string) =>
  ["text", "search", "email", "url", "tel"].includes(type);

export const isContentEditableLike = (el: HTMLElement) => {
  const value = el.getAttribute("contenteditable");
  return el.isContentEditable || value === "true" || value === "plaintext-only";
};

export const isEditableElement = (el: Element | null): boolean => {
  const htmlEl = asHtmlElement(el);
  if (!htmlEl) return false;

  if (htmlEl instanceof HTMLTextAreaElement) return true;
  if (htmlEl instanceof HTMLInputElement) return isTextInputType(htmlEl.type);

  return (
    isContentEditableLike(htmlEl) || htmlEl.getAttribute("role") === "textbox"
  );
};

export const getSelectionElement = () => {
  const selection = window.getSelection();
  if (!selection) return null;

  const anchor = selection.anchorNode;
  if (isNodeElement(anchor)) return anchor as HTMLElement;

  return asHtmlElement(anchor?.parentElement ?? null);
};
