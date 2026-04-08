import { getGoogleDocsIframeDocument, isGoogleDocsSite } from "../google-docs";
import { isUsableRect, toCaretRect } from "./caret-utils";

const getGoogleDocsIframeElement = (): HTMLIFrameElement | null => {
  return (
    document.querySelector<HTMLIFrameElement>(".docs-texteventtarget-iframe") ??
    null
  );
};

const translateRectFromIframeToViewport = (
  rect: DOMRect,
  ownerDocument: Document | null,
): DOMRect => {
  if (!isGoogleDocsSite()) {
    return rect;
  }

  const iframeDoc = getGoogleDocsIframeDocument();
  if (!iframeDoc || ownerDocument !== iframeDoc) {
    return rect;
  }

  const iframe = getGoogleDocsIframeElement();
  if (!iframe) {
    return rect;
  }

  const iframeRect = iframe.getBoundingClientRect();

  return new DOMRect(
    iframeRect.left + rect.left,
    iframeRect.top + rect.top,
    rect.width,
    rect.height,
  );
};
export const toViewportCaretRect = (
  rect: DOMRect,
  ownerDocument: Document | null,
) => {
  const caretRect = toCaretRect(rect);
  return translateRectFromIframeToViewport(caretRect, ownerDocument);
};

const getRangeCaretRect = (range: Range): DOMRect | null => {
  const collapsed = range.cloneRange();
  collapsed.collapse(true);

  const ownerDocument =
    collapsed.startContainer?.ownerDocument ??
    range.startContainer.ownerDocument;

  const rects = Array.from(collapsed.getClientRects());
  const directRect =
    rects[rects.length - 1] ?? collapsed.getBoundingClientRect();

  if (isUsableRect(directRect)) {
    return toViewportCaretRect(directRect, ownerDocument);
  }

  const markerDocument = ownerDocument ?? document;
  const marker = markerDocument.createElement("span");
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
    return translateRectFromIframeToViewport(
      new DOMRect(
        markerRect.left,
        markerRect.top,
        1,
        Math.max(1, markerRect.height),
      ),
      ownerDocument,
    );
  }

  return null;
};

const getBrowserSelection = (): Selection | null => {
  if (isGoogleDocsSite()) {
    const iframeDoc = getGoogleDocsIframeDocument();

    try {
      const iframeSelection = iframeDoc?.defaultView?.getSelection() ?? null;
      if (iframeSelection && iframeSelection.rangeCount > 0) {
        return iframeSelection;
      }
    } catch {
      // ignore
    }
  }

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    return selection;
  }

  return null;
};

const isSelectionInsideTarget = (el: HTMLElement, range: Range) => {
  const startNode = range.startContainer;
  const endNode = range.endContainer;

  if (startNode === el || endNode === el) {
    return true;
  }

  if (el.contains(startNode) || el.contains(endNode)) {
    return true;
  }

  if (isGoogleDocsSite()) {
    return true;
  }

  return false;
};

export const getSelectionClientRect = (el: HTMLElement): DOMRect | null => {
  const selection = getBrowserSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);

  if (!isSelectionInsideTarget(el, range)) {
    return null;
  }

  return getRangeCaretRect(range);
};
