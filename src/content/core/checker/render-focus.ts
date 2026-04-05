import {
  clearFocusedErrorId,
  clearSelectedErrorRange,
  setFocusedErrorId,
  setSelectedErrorRange,
} from "../state";
import { focusHighlightedErrorById, focusErrorRangeByOffsets } from "../../dom";
import type { HighlightErrorItem } from "../error-state";

export const focusErrorForElement = (
  element: HTMLElement,
  item: HighlightErrorItem,
) => {
  clearSelectedErrorRange();
  clearFocusedErrorId();

  if (
    typeof item.start === "number" &&
    typeof item.end === "number" &&
    item.end > item.start
  ) {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.focus();
      element.setSelectionRange(item.start, item.end);
      setSelectedErrorRange({
        start: item.start,
        end: item.end,
      });
      setFocusedErrorId(item.id ?? null);
      return true;
    }

    const ok = focusErrorRangeByOffsets(
      element,
      item.start,
      item.end,
      item.word,
    );

    if (ok) {
      setSelectedErrorRange({
        start: item.start,
        end: item.end,
      });
      setFocusedErrorId(item.id ?? null);
      return true;
    }
  }

  if (item.id) {
    setFocusedErrorId(item.id);
    return focusHighlightedErrorById(element, item.id);
  }

  return false;
};
