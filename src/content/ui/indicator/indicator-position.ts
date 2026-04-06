export const getIndicatorPosition = (
  rect: DOMRect,
  popupWidth: number,
  popupHeight: number,
  hasSuggestionList = false,
) => {
  const viewportPadding = 12;
  const sideGap = hasSuggestionList ? 8 : 5;
  const verticalGap = hasSuggestionList ? 8 : 0;

  let top = hasSuggestionList
    ? rect.bottom + verticalGap
    : rect.top + rect.height / 2 - popupHeight / 2;

  let left = rect.right + sideGap;

  if (left + popupWidth > window.innerWidth - viewportPadding) {
    left = rect.left - popupWidth - sideGap;
  }

  if (left < viewportPadding) {
    left = viewportPadding;
  }

  if (hasSuggestionList) {
    if (top + popupHeight > window.innerHeight - viewportPadding) {
      top = rect.top - popupHeight - verticalGap;
    }
  }

  if (top < viewportPadding) {
    top = viewportPadding;
  }

  if (top + popupHeight > window.innerHeight - viewportPadding) {
    top = window.innerHeight - popupHeight - viewportPadding;
  }

  return { top, left };
};
