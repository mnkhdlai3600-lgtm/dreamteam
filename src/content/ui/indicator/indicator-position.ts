export const getIndicatorPosition = (
  rect: DOMRect,
  popupWidth: number,
  popupHeight: number,
  hasSuggestionList = false,
) => {
  const viewportPadding = 8;

  let top = hasSuggestionList
    ? rect.bottom + 2
    : rect.top + rect.height / 2 - popupHeight / 2;

  let left = hasSuggestionList ? rect.left - 8 : rect.left - popupWidth / 2 + 1;

  if (hasSuggestionList) {
    if (left + popupWidth > window.innerWidth - viewportPadding) {
      left = rect.right - popupWidth;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (top + popupHeight > window.innerHeight - viewportPadding) {
      top = rect.top - popupHeight - 8;
    }
  } else {
    if (left + popupWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - popupWidth - viewportPadding;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }
  }

  if (top < viewportPadding) top = viewportPadding;

  if (top + popupHeight > window.innerHeight - viewportPadding) {
    top = window.innerHeight - popupHeight - viewportPadding;
  }

  return { top, left };
};
