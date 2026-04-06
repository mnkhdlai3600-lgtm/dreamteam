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

const isUsableRect = (rect: DOMRect | null | undefined) =>
  !!rect &&
  Number.isFinite(rect.left) &&
  Number.isFinite(rect.top) &&
  (rect.width > 0 || rect.height > 0);

const toCaretRect = (rect: DOMRect) =>
  new DOMRect(rect.right, rect.top, 1, Math.max(1, rect.height));

const buildRectFromMarker = (
  markerRect: DOMRect,
  mirrorRect: DOMRect,
  inputRect: DOMRect,
  scrollLeft: number,
  scrollTop: number,
  lineHeight: number,
) => {
  const left =
    inputRect.left + (markerRect.left - mirrorRect.left) - scrollLeft;
  const top = inputRect.top + (markerRect.top - mirrorRect.top) - scrollTop;

  return new DOMRect(left, top, 1, lineHeight);
};

const getTextControlRectAt = (
  el: HTMLInputElement | HTMLTextAreaElement,
  index: number,
) => {
  const { div, marker } = createMirrorForTextControl(el, index);

  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = div.getBoundingClientRect();
  const inputRect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  const lineHeight = parseFloat(style.lineHeight) || inputRect.height * 0.6;

  const rect = buildRectFromMarker(
    markerRect,
    mirrorRect,
    inputRect,
    el.scrollLeft,
    el.scrollTop,
    lineHeight,
  );

  div.remove();
  return rect;
};

const getRangeCaretRect = (range: Range): DOMRect | null => {
  const collapsed = range.cloneRange();
  collapsed.collapse(true);

  const rects = Array.from(collapsed.getClientRects());
  const directRect =
    rects[rects.length - 1] ?? collapsed.getBoundingClientRect();

  if (isUsableRect(directRect)) {
    return toCaretRect(directRect);
  }

  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  marker.setAttribute("data-bolor-caret-marker", "true");

  collapsed.insertNode(marker);

  const markerRect = marker.getBoundingClientRect();
  const parent = marker.parentNode;
  marker.remove();

  if (parent) {
    parent.normalize();
  }

  if (isUsableRect(markerRect)) {
    return new DOMRect(
      markerRect.left,
      markerRect.top,
      1,
      Math.max(1, markerRect.height),
    );
  }

  return null;
};

export const getSelectionClientRect = (el: HTMLElement): DOMRect | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;
  const endNode = range.endContainer;

  if (
    startNode !== el &&
    endNode !== el &&
    !el.contains(startNode) &&
    !el.contains(endNode)
  ) {
    return null;
  }

  return getRangeCaretRect(range);
};

const getLastNonEmptyTextNode = (el: HTMLElement): Text | null => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = (node.nodeValue ?? "").replace(/\u00A0/g, " ");

    if (value.trim()) {
      last = node;
    }
  }

  return last;
};

const getLastVisibleTextEndRect = (el: HTMLElement): DOMRect | null => {
  const lastTextNode = getLastNonEmptyTextNode(el);
  if (!lastTextNode) return null;

  const rawValue = lastTextNode.nodeValue ?? "";
  let end = rawValue.length;

  while (end > 0 && /\s/.test(rawValue[end - 1] ?? "")) {
    end -= 1;
  }

  if (end <= 0) return null;

  const range = document.createRange();
  range.setStart(lastTextNode, end - 1);
  range.setEnd(lastTextNode, end);

  const rects = Array.from(range.getClientRects());
  const rect = rects[rects.length - 1] ?? range.getBoundingClientRect();

  if (!isUsableRect(rect)) {
    return null;
  }

  return toCaretRect(rect);
};

const getContentEditableTextEndRect = (el: HTMLElement): DOMRect | null => {
  const textEndRect = getLastVisibleTextEndRect(el);
  if (textEndRect) {
    return textEndRect;
  }

  const selectionRect = getSelectionClientRect(el);
  if (selectionRect) {
    return selectionRect;
  }

  const fallback = el.getBoundingClientRect();
  if (!isUsableRect(fallback)) return null;

  return new DOMRect(
    fallback.left + 4,
    fallback.top + 6,
    1,
    Math.max(20, fallback.height - 12),
  );
};

export const getCaretClientRect = (el: HTMLElement): DOMRect | null => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const caretIndex = el.selectionStart ?? el.value.length;
    return getTextControlRectAt(el, caretIndex);
  }

  return getSelectionClientRect(el);
};

export const getTextEndClientRect = (el: HTMLElement): DOMRect | null => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return getTextControlRectAt(el, el.value.length);
  }

  return getContentEditableTextEndRect(el);
};
