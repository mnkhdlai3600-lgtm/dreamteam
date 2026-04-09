import {
  getElementText,
  replaceCurrentSelectionInContentEditable,
  replaceHighlightedErrorText,
  replaceRangeInContentEditable,
  setElementText,
} from "../../../dom";
import { selectedErrorRange, shouldApplyFullTextSuggestion } from "../../state";
import { replaceActiveSentenceText } from "./apply-utils";

export const applySuggestionToContentEditable = async (
  resolved: HTMLElement,
  suggestion: string,
  isLatinInput: boolean,
  targetErrorId?: string | null,
  targetWord?: string,
) => {
  if (isLatinInput) {
    const currentText = getElementText(resolved).trim();
    const nextText = shouldApplyFullTextSuggestion
      ? suggestion
      : replaceActiveSentenceText(currentText, suggestion);
    const ok = await setElementText(resolved, nextText);

    return {
      ok,
      nextText,
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
