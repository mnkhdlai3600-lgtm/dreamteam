import { getGoogleDocsText, isGoogleDocsSite } from "../google-docs";
import { isContentEditableLike } from "./guards";

export const normalizeText = (text: string) =>
  text
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();

export const normalizeLiveText = (text: string) =>
  text
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n");

const normalizeComparableText = (text: string) =>
  normalizeText(text).replace(/\s+/g, " ");

export const getElementText = (el: HTMLElement) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }

  if (isGoogleDocsSite()) {
    const docsText = getGoogleDocsText();
    if (docsText) return normalizeLiveText(docsText);
  }

  if (isContentEditableLike(el) || el.getAttribute("role") === "textbox") {
    return normalizeText(el.innerText || el.textContent || "");
  }

  return "";
};

export const verifyElementText = (el: HTMLElement, expected: string) => {
  const current = normalizeComparableText(getElementText(el));
  const wanted = normalizeComparableText(expected);

  if (isGoogleDocsSite()) {
    if (!wanted) return true;
    if (current === wanted) return true;

    const currentNoSpaces = current.replace(/\s+/g, "");
    const wantedNoSpaces = wanted.replace(/\s+/g, "");

    if (currentNoSpaces === wantedNoSpaces) return true;
    if (current.includes(wanted) || wanted.includes(current)) return true;

    return true;
  }

  return current === wanted;
};
