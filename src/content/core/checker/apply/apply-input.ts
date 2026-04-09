import { selectedErrorRange, shouldApplyFullTextSuggestion } from "../../state";
import { replaceActiveSentenceText } from "./apply-utils";

const setCaretToEnd = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
) => {
  const nextCaret = value.length;
  element.setSelectionRange(nextCaret, nextCaret);
};

export const replaceSelectedRangeInInput = (
  element: HTMLInputElement | HTMLTextAreaElement,
  replacement: string
) => {
  const rangeStart = selectedErrorRange?.start ?? element.selectionStart ?? 0;
  const rangeEnd =
    selectedErrorRange?.end ?? element.selectionEnd ?? rangeStart;

  const currentValue = element.value;
  const nextValue =
    currentValue.slice(0, rangeStart) +
    replacement +
    currentValue.slice(rangeEnd);

  element.value = nextValue;

  const nextCaret = rangeStart + replacement.length;
  element.setSelectionRange(nextCaret, nextCaret);

  return nextValue;
};

export const applySuggestionToInput = (
  element: HTMLInputElement | HTMLTextAreaElement,
  suggestion: string,
  isLatinInput: boolean
) => {
  const hasSavedRange =
    !!selectedErrorRange && selectedErrorRange.end > selectedErrorRange.start;

  const hasLiveSelection =
    (element.selectionStart ?? 0) !== (element.selectionEnd ?? 0);

  if (!isLatinInput && (hasSavedRange || hasLiveSelection)) {
    const nextText = replaceSelectedRangeInInput(element, suggestion);
    return { ok: true, nextText };
  }

  if (isLatinInput) {
    const currentValue = element.value;
    const nextText = shouldApplyFullTextSuggestion
      ? suggestion
      : replaceActiveSentenceText(currentValue, suggestion);

    element.value = nextText;
    setCaretToEnd(element, nextText);

    return {
      ok: true,
      nextText,
    };
  }

  element.value = suggestion;
  setCaretToEnd(element, suggestion);

  return {
    ok: true,
    nextText: suggestion,
  };
};
