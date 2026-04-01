import { isMessengerSite } from "./editable";

export type EditableMode =
  | "plain-input"
  | "contenteditable-inline"
  | "contenteditable-fallback";

export const getEditableMode = (element: HTMLElement | null): EditableMode => {
  if (!element) return "plain-input";

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return "plain-input";
  }

  if (isMessengerSite()) {
    return "contenteditable-fallback";
  }

  if (element.isContentEditable || element.getAttribute("role") === "textbox") {
    return "contenteditable-inline";
  }

  return "plain-input";
};
