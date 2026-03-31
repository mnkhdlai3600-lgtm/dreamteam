export const placeCursorAtEnd = (el: HTMLElement) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const len = el.value.length;
    el.setSelectionRange?.(len, len);
    return;
  }

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

export const dispatchSyntheticInput = (
  el: HTMLElement,
  inputType: string,
  data: string | null,
) => {
  try {
    el.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType,
        data,
      }),
    );
  } catch {}

  try {
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType,
        data,
      }),
    );
  } catch {}
};

export const createFragmentFromText = (value: string) => {
  const fragment = document.createDocumentFragment();

  value.split("\n").forEach((line, index) => {
    if (index > 0) fragment.appendChild(document.createElement("br"));
    fragment.appendChild(document.createTextNode(line));
  });

  return fragment;
};

const createMirrorForTextControl = (
  el: HTMLInputElement | HTMLTextAreaElement,
  caretIndex: number,
) => {
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

  const value = el.value ?? "";
  const before = value.slice(0, caretIndex);
  const after = value.slice(caretIndex);

  div.textContent = before;

  const marker = document.createElement("span");
  marker.textContent = after.length > 0 ? after[0] : "\u200b";
  div.appendChild(marker);

  if (after.length > 1) {
    div.appendChild(document.createTextNode(after.slice(1)));
  }

  document.body.appendChild(div);

  return { div, marker };
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

    document.body.removeChild(div);

    return new DOMRect(left, top, 1, height);
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);

  const rects = range.getClientRects();
  if (rects.length > 0) {
    return rects[0];
  }

  const fallbackRange = document.createRange();
  fallbackRange.selectNodeContents(el);
  fallbackRange.collapse(false);

  const fallbackRects = fallbackRange.getClientRects();
  if (fallbackRects.length > 0) {
    return fallbackRects[0];
  }

  return el.getBoundingClientRect();
};
