import { getHighlightedErrorElementById } from "../highlights/highlight";
import {
  normalizeComparableText,
  replaceSelectedTextWithCommand,
} from "./core";
import { resolveReplaceRange } from "./range";
import { dispatchSyntheticInput } from "../selection";

export const replaceCurrentSelectionInContentEditable = (
  root: HTMLElement,
  value: string,
  expectedWord?: string,
) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const selectedText = normalizeComparableText(selection.toString());
  const normalizedExpected = normalizeComparableText(expectedWord ?? "");

  if (!selectedText) return false;
  if (normalizedExpected && selectedText !== normalizedExpected) return false;

  root.focus();

  if (replaceSelectedTextWithCommand(root, value)) {
    return true;
  }

  range.deleteContents();
  const textNode = document.createTextNode(value);
  range.insertNode(textNode);

  const nextRange = document.createRange();
  nextRange.setStart(textNode, value.length);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);

  dispatchSyntheticInput(root, "insertReplacementText", value);
  return true;
};

export const replaceRangeInContentEditable = (
  root: HTMLElement,
  start: number,
  end: number,
  value: string,
  expectedWord?: string,
) => {
  const selection = window.getSelection();
  if (!selection) return false;

  const range = resolveReplaceRange(root, start, end, expectedWord);
  if (!range) return false;

  root.focus();
  selection.removeAllRanges();
  selection.addRange(range);

  if (replaceSelectedTextWithCommand(root, value)) {
    return true;
  }

  range.deleteContents();
  const textNode = document.createTextNode(value);
  range.insertNode(textNode);

  const nextRange = document.createRange();
  nextRange.setStart(textNode, value.length);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);

  dispatchSyntheticInput(root, "insertReplacementText", value);
  return true;
};

export const replaceHighlightedErrorText = (
  root: HTMLElement,
  errorId: string,
  value: string,
) => {
  const errorEl = getHighlightedErrorElementById(root, errorId);
  if (!errorEl) return false;

  const selection = window.getSelection();
  if (!selection) return false;

  const range = document.createRange();
  range.selectNodeContents(errorEl);
  selection.removeAllRanges();
  selection.addRange(range);

  if (replaceSelectedTextWithCommand(root, value)) {
    return true;
  }

  errorEl.replaceWith(document.createTextNode(value));
  dispatchSyntheticInput(root, "insertReplacementText", value);
  return true;
};
