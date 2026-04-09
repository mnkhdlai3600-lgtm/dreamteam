<<<<<<< HEAD
import {
  lastAppliedText,
  lastCheckedText,
  selectedErrorRange,
} from "../../state";

const normalizeCompareText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

const setCaretToEnd = (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  const nextCaret = value.length;
  element.setSelectionRange(nextCaret, nextCaret);
};
=======
import { selectedErrorRange, shouldApplyFullTextSuggestion } from "../../state";
import { replaceActiveSentenceText } from "./apply-utils";
>>>>>>> temp-fix

export const replaceSelectedRangeInInput = (
  element: HTMLInputElement | HTMLTextAreaElement,
  replacement: string,
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

const replaceLastScopedTextInInput = (
  element: HTMLInputElement | HTMLTextAreaElement,
  replacement: string,
) => {
  const currentValue = element.value;
  const checked = lastCheckedText.trim();
  const applied = (lastAppliedText ?? "").trim();

  if (!currentValue.trim()) {
    element.value = replacement;
    setCaretToEnd(element, replacement);
    return replacement;
  }

  if (checked) {
    const normalizedCurrent = normalizeCompareText(currentValue);
    const normalizedChecked = normalizeCompareText(checked);

    if (
      normalizedCurrent &&
      normalizedChecked &&
      normalizedCurrent.endsWith(normalizedChecked)
    ) {
      const index = currentValue.lastIndexOf(checked);

      if (index >= 0) {
        const nextValue =
          currentValue.slice(0, index) +
          replacement +
          currentValue.slice(index + checked.length);

        element.value = nextValue;
        setCaretToEnd(element, nextValue);
        return nextValue;
      }
    }
  }

  if (applied && currentValue.startsWith(applied)) {
    const suffix = currentValue.slice(applied.length).trimStart();

    if (suffix) {
      const suffixIndex = currentValue.lastIndexOf(suffix);

      if (suffixIndex >= 0) {
        const nextValue =
          currentValue.slice(0, suffixIndex) +
          replacement +
          currentValue.slice(suffixIndex + suffix.length);

        element.value = nextValue;
        setCaretToEnd(element, nextValue);
        return nextValue;
      }
    }
  }

  element.value = replacement;
  setCaretToEnd(element, replacement);
  return replacement;
};

export const applySuggestionToInput = (
  element: HTMLInputElement | HTMLTextAreaElement,
  suggestion: string,
  isLatinInput: boolean,
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
<<<<<<< HEAD
    const nextText = replaceLastScopedTextInInput(element, suggestion);
    return { ok: true, nextText };
=======
    const currentValue = element.value;
    const nextText = shouldApplyFullTextSuggestion
      ? suggestion
      : replaceActiveSentenceText(currentValue, suggestion);

    element.value = nextText;
    element.setSelectionRange(nextText.length, nextText.length);

    return {
      ok: true,
      nextText,
    };
>>>>>>> temp-fix
  }

  element.value = suggestion;
  setCaretToEnd(element, suggestion);

  return {
    ok: true,
    nextText: suggestion,
  };
};
