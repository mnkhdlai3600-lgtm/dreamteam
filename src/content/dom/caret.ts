const createMirrorForTextControl = (
  el: HTMLInputElement | HTMLTextAreaElement,
  caretIndex: number,
) => {
  const div = document.createElement("div");
  const style = window.getComputedStyle(el);

  const props = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "lineHeight",
    "fontFamily",
    "letterSpacing",
    "textAlign",
    "textIndent",
    "textTransform",
    "whiteSpace",
    "wordSpacing",
  ] as const;

  div.style.position = "fixed";
  div.style.left = "-9999px";
  div.style.top = "0";
  div.style.visibility = "hidden";
  div.style.pointerEvents = "none";
  div.style.whiteSpace = el instanceof HTMLTextAreaElement ? "pre-wrap" : "pre";
  div.style.wordWrap = "break-word";

  for (const prop of props) {
    div.style[prop] = style[prop];
  }

  const before = el.value.slice(0, caretIndex);
  const after = el.value.slice(caretIndex);

  div.textContent = before;

  const marker = document.createElement("span");
  marker.textContent = after[0] || "\u200b";
  div.appendChild(marker);

  if (after.length > 1) {
    div.appendChild(document.createTextNode(after.slice(1)));
  }

  document.body.appendChild(div);
  return { div, marker };
};

const getContentEditableCaretRect = (el: HTMLElement): DOMRect | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);

  const directRect = range.getBoundingClientRect();
  if (directRect.width || directRect.height) return directRect;

  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  marker.setAttribute("data-bolor-caret-marker", "true");

  range.insertNode(marker);

  const markerRect = marker.getBoundingClientRect();
  const cleanupRange = document.createRange();
  cleanupRange.setStartAfter(marker);
  cleanupRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(cleanupRange);
  marker.remove();

  if (markerRect.width || markerRect.height) {
    return new DOMRect(markerRect.left, markerRect.top, 1, markerRect.height);
  }

  const fallback = el.getBoundingClientRect();
  return new DOMRect(fallback.left, fallback.top, 1, fallback.height);
};

export const getCaretClientRect = (el: HTMLElement): DOMRect | null => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const caretIndex = el.selectionStart ?? el.value.length;
    const { div, marker } = createMirrorForTextControl(el, caretIndex);

    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = div.getBoundingClientRect();
    const inputRect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    const left =
      inputRect.left + (markerRect.left - mirrorRect.left) - el.scrollLeft;
    const top =
      inputRect.top + (markerRect.top - mirrorRect.top) - el.scrollTop;
    const height = parseFloat(style.lineHeight) || inputRect.height * 0.6;

    div.remove();
    return new DOMRect(left, top, 1, height);
  }

  return getContentEditableCaretRect(el);
};
