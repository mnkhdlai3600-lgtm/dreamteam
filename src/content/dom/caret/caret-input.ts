import { buildRectFromMarker } from "./caret-utils";

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

export const getTextControlRectAt = (
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
