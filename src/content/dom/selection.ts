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
    if (index > 0) {
      fragment.appendChild(document.createElement("br"));
    }

    fragment.appendChild(document.createTextNode(line));
  });

  return fragment;
};
