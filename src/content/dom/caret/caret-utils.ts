export const isUsableRect = (rect: DOMRect | null | undefined) =>
  !!rect &&
  Number.isFinite(rect.left) &&
  Number.isFinite(rect.top) &&
  (rect.width > 0 || rect.height > 0);

export const toCaretRect = (rect: DOMRect) =>
  new DOMRect(rect.right, rect.top, 1, Math.max(1, rect.height));

export const buildRectFromMarker = (
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
