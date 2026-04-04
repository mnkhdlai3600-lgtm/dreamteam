import { clearSelectedErrorRange, setSelectedErrorRange } from "../state";
import { focusHighlightedErrorById } from "../../dom";
import type { HighlightErrorItem } from "../error-state";

export const focusErrorForElement = (
  element: HTMLElement,
  item: HighlightErrorItem,
) => {
  clearSelectedErrorRange();

  if (
    (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement) &&
    typeof item.start === "number" &&
    typeof item.end === "number"
  ) {
    element.focus();
    element.setSelectionRange(item.start, item.end);
    setSelectedErrorRange({
      start: item.start,
      end: item.end,
    });
    return true;
  }

  if (item.id) {
    return focusHighlightedErrorById(element, item.id);
  }

  return false;
};
