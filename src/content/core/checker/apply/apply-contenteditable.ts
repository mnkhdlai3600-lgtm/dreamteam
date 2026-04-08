import {
  getElementText,
  replaceCurrentSelectionInContentEditable,
  replaceHighlightedErrorText,
  replaceRangeInContentEditable,
  setElementText,
} from "../../../dom";
import { selectedErrorRange } from "../../state";

export const applySuggestionToContentEditable = async (
  resolved: HTMLElement,
  suggestion: string,
  isLatinInput: boolean,
  targetErrorId?: string | null,
  targetWord?: string,
) => {
  if (isLatinInput) {
    const ok = await setElementText(resolved, suggestion);

    return {
      ok,
      nextText: suggestion,
    };
  }

  let ok = replaceCurrentSelectionInContentEditable(
    resolved,
    suggestion,
    targetWord,
  );

  if (
    !ok &&
    selectedErrorRange &&
    selectedErrorRange.end > selectedErrorRange.start
  ) {
    ok = replaceRangeInContentEditable(
      resolved,
      selectedErrorRange.start,
      selectedErrorRange.end,
      suggestion,
      targetWord,
    );
  }

  if (!ok && targetErrorId) {
    ok = replaceHighlightedErrorText(resolved, targetErrorId, suggestion);
  }

  return {
    ok,
    nextText: getElementText(resolved).trim(),
  };
};
