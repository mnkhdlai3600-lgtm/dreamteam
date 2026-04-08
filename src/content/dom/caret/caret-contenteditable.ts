import { getSelectionClientRect, toViewportCaretRect } from "./caret-selection";
import { isUsableRect } from "./caret-utils";

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

  return toViewportCaretRect(rect, lastTextNode.ownerDocument);
};

export const getContentEditableTextEndRect = (
  el: HTMLElement,
): DOMRect | null => {
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
