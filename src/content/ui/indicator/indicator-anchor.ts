export const getTextEndRectForInput = (
  el: HTMLInputElement | HTMLTextAreaElement,
): DOMRect => {
  const div = document.createElement("div");
  const style = window.getComputedStyle(el);

  const properties = [
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
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "letterSpacing",
    "textTransform",
    "textAlign",
    "textIndent",
    "textDecoration",
    "textRendering",
    "wordSpacing",
    "whiteSpace",
  ] as const;

  div.style.position = "fixed";
  div.style.left = "-9999px";
  div.style.top = "0";
  div.style.visibility = "hidden";
  div.style.pointerEvents = "none";
  div.style.whiteSpace = el instanceof HTMLTextAreaElement ? "pre-wrap" : "pre";
  div.style.wordWrap = "break-word";

  for (const prop of properties) {
    div.style[prop] = style[prop];
  }

  div.textContent = el.value ?? "";

  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  div.appendChild(marker);

  document.body.appendChild(div);

  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = div.getBoundingClientRect();
  const inputRect = el.getBoundingClientRect();
  const lineHeight = parseFloat(style.lineHeight) || inputRect.height * 0.6;

  const rect = new DOMRect(
    inputRect.left + (markerRect.left - mirrorRect.left) - el.scrollLeft,
    inputRect.top + (markerRect.top - mirrorRect.top) - el.scrollTop,
    1,
    lineHeight,
  );

  document.body.removeChild(div);
  return rect;
};

export const getTextEndRectForEditable = (el: HTMLElement): DOMRect => {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);

  const rects = range.getClientRects();
  if (rects.length > 0) {
    return rects[rects.length - 1];
  }

  return el.getBoundingClientRect();
};

export const getTextEndAnchorRect = (target: HTMLElement): DOMRect => {
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return getTextEndRectForInput(target);
  }

  return getTextEndRectForEditable(target);
};
