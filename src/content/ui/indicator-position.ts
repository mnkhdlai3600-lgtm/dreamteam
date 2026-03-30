export const getIndicatorPosition = (
  rect: DOMRect,
  popupWidth: number,
  popupHeight: number,
) => {
  const spacing = 10;

  let top = rect.bottom + spacing;
  let left = rect.left + rect.width / 2 - popupWidth / 2;

  if (top + popupHeight > window.innerHeight - 8) {
    top = rect.top - popupHeight - spacing;
  }

  if (top < 8) top = 8;

  if (left + popupWidth > window.innerWidth - 8) {
    left = window.innerWidth - popupWidth - 8;
  }

  if (left < 8) left = 8;

  return { top, left };
};
