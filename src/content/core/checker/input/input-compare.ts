import { isGoogleDocsSite } from "../../../dom/google-docs";
import {
  hasSuggestions,
  isSuggestionLoading,
  lastAppliedText,
  lastCheckedText,
  suggestionPhase,
} from "../../state";

const LATIN_RE = /[A-Za-z]/g;
const CYRILLIC_RE = /[А-ЯӨҮЁа-яөүё]/g;

const countMatches = (text: string, regex: RegExp) => {
  return text.match(regex)?.length ?? 0;
};

export const isMostlyLatinText = (text: string) => {
  const latinCount = countMatches(text, LATIN_RE);
  const cyrillicCount = countMatches(text, CYRILLIC_RE);

  if (!latinCount) return false;
  if (!cyrillicCount) return true;

  return latinCount > cyrillicCount * 1.2;
};

export const normalizeCompareText = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

export const getVisualStateFromText = (text: string) => {
  return isMostlyLatinText(text) ? "latin" : "idle";
};

export const shouldSkipSameTextCheck = (text: string) => {
  if (!text) return true;

  const normalizedText = normalizeCompareText(text);
  const normalizedApplied = normalizeCompareText(lastAppliedText ?? "");
  const normalizedChecked = normalizeCompareText(lastCheckedText);

  if (normalizedApplied && normalizedText === normalizedApplied) {
    return true;
  }

  if (!isGoogleDocsSite()) {
    return !!normalizedChecked && normalizedText === normalizedChecked;
  }

  return false;
};

export const shouldResetDocsSuggestionState = (text: string) => {
  if (!isGoogleDocsSite()) return false;
  if (!text.trim()) return false;

  const hasUi =
    hasSuggestions() || isSuggestionLoading || suggestionPhase === "suggesting";

  if (!hasUi) return false;
  if (!lastCheckedText.trim()) return false;

  const normalizedText = normalizeCompareText(text);
  const normalizedChecked = normalizeCompareText(lastCheckedText);

  if (!normalizedText || !normalizedChecked) return false;
  if (normalizedText === normalizedChecked) return false;

  const justApplied =
    !!lastAppliedText &&
    normalizeCompareText(lastAppliedText) === normalizedText;

  return !justApplied;
};
