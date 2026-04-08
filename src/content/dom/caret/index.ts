import { getContentEditableTextEndRect } from "./caret-contenteditable";
import { getTextControlRectAt } from "./caret-input";
import { getSelectionClientRect } from "./caret-selection";

export { getSelectionClientRect } from "./caret-selection";

export const getCaretClientRect = (el: HTMLElement): DOMRect | null => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const caretIndex = el.selectionStart ?? el.value.length;
    return getTextControlRectAt(el, caretIndex);
  }

  return getSelectionClientRect(el);
};

export const getTextEndClientRect = (el: HTMLElement): DOMRect | null => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return getTextControlRectAt(el, el.value.length);
  }

  return getContentEditableTextEndRect(el);
};
