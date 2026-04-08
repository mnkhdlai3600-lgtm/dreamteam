import {
  DOCS_PAGE_SELECTOR,
  DOCS_TEXT_SELECTORS,
  getGoogleDocsPage,
  isVisibleDocsRect,
} from "./docs-core";

export const stripInvisibleDocsChars = (value: string) =>
  value
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "");

export const normalizeDocsText = (value: string) =>
  stripInvisibleDocsChars(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const normalizeDocsCacheText = (value: string) =>
  stripInvisibleDocsChars(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ ]{2,}/g, " ");

export const normalizeDocsComparableText = (value: string) =>
  normalizeDocsCacheText(value).replace(/\s+/g, " ").trim();

const mergeDocsTextParts = (parts: string[]) => {
  return parts
    .map((part) => normalizeDocsText(part))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

const isVisibleTextNode = (node: HTMLElement) => {
  const rect = node.getBoundingClientRect();
  const style = window.getComputedStyle(node);

  return (
    isVisibleDocsRect(rect) &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
};

const uniqueOrderedText = (values: string[]) => {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeDocsText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
};

const getVisibleDocsPages = () => {
  return Array.from(document.querySelectorAll<HTMLElement>(DOCS_PAGE_SELECTOR))
    .filter((page) => isVisibleDocsRect(page.getBoundingClientRect()))
    .sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      if (ar.top !== br.top) return ar.top - br.top;
      return ar.left - br.left;
    });
};

export const readDocsTextFromPage = (page: HTMLElement | null) => {
  if (!page) return "";

  const nodes = Array.from(
    page.querySelectorAll<HTMLElement>(DOCS_TEXT_SELECTORS),
  ).filter(isVisibleTextNode);

  if (!nodes.length) return "";

  const parts = uniqueOrderedText(
    nodes.map((node) => node.innerText || node.textContent || ""),
  );

  return mergeDocsTextParts(parts);
};

export const getActiveDocsPage = (target?: EventTarget | null) => {
  const directPage = getGoogleDocsPage(target);
  if (directPage) return directPage;

  const visiblePages = getVisibleDocsPages();
  return visiblePages[0] ?? null;
};
