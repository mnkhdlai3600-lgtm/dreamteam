import {
  DOCS_PAGE_SELECTOR,
  DOCS_TEXT_SELECTORS,
  getGoogleDocsIframeDocument,
  getGoogleDocsPage,
  isVisibleDocsRect,
} from "./docs-core";
import { getGoogleDocsCursorRect } from "./docs-cursor";

type DocsTextPiece = {
  text: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const LINE_TOLERANCE = 6;
const WORD_GAP_SPACE_THRESHOLD = 0.5;

const FALLBACK_DOCS_TEXT_SELECTORS = [
  ".kix-wordhtmlgenerator-word-node",
  ".kix-lineview-content",
  ".kix-lineview-text-block",
  ".kix-lineview span",
  ".kix-lineview",
].join(",");

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

const getSearchDocs = (target?: EventTarget | null) => {
  const docs: Document[] = [];
  const targetDoc =
    target &&
    typeof target === "object" &&
    "ownerDocument" in target &&
    (target as Node).ownerDocument
      ? (target as Node).ownerDocument
      : null;

  if (targetDoc) docs.push(targetDoc);

  const iframeDoc = getGoogleDocsIframeDocument();
  if (iframeDoc && !docs.includes(iframeDoc)) docs.push(iframeDoc);

  if (!docs.includes(document)) docs.push(document);

  return docs;
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

const getVisibleDocsPagesFromDoc = (doc: Document) => {
  return Array.from(doc.querySelectorAll<HTMLElement>(DOCS_PAGE_SELECTOR))
    .filter((page) => isVisibleDocsRect(page.getBoundingClientRect()))
    .sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      if (ar.top !== br.top) return ar.top - br.top;
      return ar.left - br.left;
    });
};

export const getVisibleDocsPages = (target?: EventTarget | null) => {
  return getSearchDocs(target).flatMap((doc) =>
    getVisibleDocsPagesFromDoc(doc),
  );
};

const getVisibleTextNodes = (page: HTMLElement | null) => {
  if (!page) return [];

  const primary = Array.from(
    page.querySelectorAll<HTMLElement>(DOCS_TEXT_SELECTORS),
  ).filter(isVisibleTextNode);

  if (primary.length > 0) {
    return primary;
  }

  return Array.from(
    page.querySelectorAll<HTMLElement>(FALLBACK_DOCS_TEXT_SELECTORS),
  ).filter(isVisibleTextNode);
};

const buildPiece = (node: HTMLElement): DocsTextPiece | null => {
  const raw = node.innerText || node.textContent || "";
  const text = normalizeDocsText(raw);

  if (!text) return null;

  const rect = node.getBoundingClientRect();

  return {
    text,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
  };
};

const dedupePieces = (pieces: DocsTextPiece[]) => {
  const seen = new Set<string>();
  const result: DocsTextPiece[] = [];

  for (const piece of pieces) {
    const key = [
      Math.round(piece.top),
      Math.round(piece.left),
      Math.round(piece.right),
      Math.round(piece.bottom),
      normalizeDocsComparableText(piece.text),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(piece);
  }

  return result;
};

const removeContainedPieces = (pieces: DocsTextPiece[]) => {
  return pieces.filter((piece, index) => {
    const current = normalizeDocsComparableText(piece.text);
    if (!current) return false;

    return !pieces.some((other, otherIndex) => {
      if (index === otherIndex) return false;

      const candidate = normalizeDocsComparableText(other.text);
      if (!candidate) return false;
      if (candidate === current) return false;
      if (candidate.length < current.length) return false;

      const sameLine =
        Math.abs(other.top - piece.top) <= LINE_TOLERANCE ||
        (other.bottom >= piece.top - LINE_TOLERANCE &&
          other.top <= piece.bottom + LINE_TOLERANCE);

      if (!sameLine) return false;

      return candidate.includes(current);
    });
  });
};

const getPagePieces = (page: HTMLElement | null) => {
  if (!page) return [];

  const pieces = getVisibleTextNodes(page)
    .map(buildPiece)
    .filter((piece): piece is DocsTextPiece => !!piece)
    .sort((a, b) => {
      if (Math.abs(a.top - b.top) > LINE_TOLERANCE) {
        return a.top - b.top;
      }

      if (a.left !== b.left) return a.left - b.left;
      return a.right - b.right;
    });

  return removeContainedPieces(dedupePieces(pieces));
};

const isWordEnd = (value: string) => /[A-Za-zА-Яа-яӨөҮүЁё0-9]$/.test(value);
const isWordStart = (value: string) => /^[A-Za-zА-Яа-яӨөҮүЁё0-9]/.test(value);

const shouldInsertSpaceBetweenPieces = (
  prev: DocsTextPiece,
  next: DocsTextPiece,
) => {
  const prevText = prev.text;
  const nextText = next.text;

  if (!prevText || !nextText) return false;

  const prevLast = prevText.slice(-1);
  const nextFirst = nextText[0];

  if (/\s/.test(prevLast) || /\s/.test(nextFirst)) return false;
  if (/^[,.;:!?%)\]}]/.test(nextText)) return false;
  if (/[(\[{]$/.test(prevText)) return false;

  const overlap = prev.right - next.left;
  if (overlap > 1) return false;

  const gap = next.left - prev.right;

  if (gap >= WORD_GAP_SPACE_THRESHOLD) return true;
  if (/[.?!:;]/.test(prevLast) && isWordStart(nextText)) return true;
  if (isWordEnd(prevText) && isWordStart(nextText) && gap >= 0) return true;

  return false;
};

const groupPiecesIntoLines = (pieces: DocsTextPiece[]) => {
  const lines: DocsTextPiece[][] = [];

  for (const piece of pieces) {
    const lastLine = lines[lines.length - 1];

    if (!lastLine) {
      lines.push([piece]);
      continue;
    }

    const lastPiece = lastLine[lastLine.length - 1];
    const sameLine =
      Math.abs(lastPiece.top - piece.top) <= LINE_TOLERANCE ||
      (piece.top <= lastPiece.bottom + LINE_TOLERANCE &&
        piece.bottom >= lastPiece.top - LINE_TOLERANCE);

    if (sameLine) {
      lastLine.push(piece);
      continue;
    }

    lines.push([piece]);
  }

  return lines.map((line) =>
    line.sort((a, b) => {
      if (a.left !== b.left) return a.left - b.left;
      return a.top - b.top;
    }),
  );
};

const mergeLinePieces = (pieces: DocsTextPiece[]) => {
  if (!pieces.length) return "";

  let result = pieces[0].text;
  let prev = pieces[0];

  for (let i = 1; i < pieces.length; i += 1) {
    const next = pieces[i];
    result += shouldInsertSpaceBetweenPieces(prev, next)
      ? ` ${next.text}`
      : next.text;
    prev = next;
  }

  return normalizeDocsCacheText(result).trim();
};

const mergePagePieces = (pieces: DocsTextPiece[]) => {
  const lines = groupPiecesIntoLines(pieces);
  const mergedLines = lines
    .map((line) => mergeLinePieces(line))
    .filter((line) => !!normalizeDocsComparableText(line));

  return normalizeDocsCacheText(mergedLines.join("\n")).trim();
};

const getFallbackPageText = (page: HTMLElement | null) => {
  if (!page) return "";

  const raw =
    page.innerText ||
    page.textContent ||
    page.querySelector<HTMLElement>(".kix-lineview")?.innerText ||
    "";

  return normalizeDocsCacheText(raw).trim();
};

const getCursorPage = (target?: EventTarget | null) => {
  const cursor = getGoogleDocsCursorRect();
  if (!cursor) return null;

  const pages = getVisibleDocsPages(target);

  return (
    pages.find((page) => {
      const rect = page.getBoundingClientRect();

      return (
        cursor.left >= rect.left - 4 &&
        cursor.right <= rect.right + 4 &&
        cursor.top >= rect.top - 20 &&
        cursor.bottom <= rect.bottom + 20
      );
    }) ?? null
  );
};

export const readDocsTextFromPage = (page: HTMLElement | null) => {
  if (!page) return "";

  const pagePieces = getPagePieces(page);
  const merged = mergePagePieces(pagePieces);

  if (merged) return merged;

  return getFallbackPageText(page);
};

export const readDocsTextFromPages = (pages: HTMLElement[]) => {
  const mergedPages = pages
    .map((page) => readDocsTextFromPage(page))
    .filter((text) => !!normalizeDocsComparableText(text));

  if (!mergedPages.length) return "";

  return normalizeDocsCacheText(mergedPages.join("\n")).trim();
};

export const getActiveDocsPage = (target?: EventTarget | null) => {
  const directPage = getGoogleDocsPage(target);
  if (directPage) return directPage;

  const cursorPage = getCursorPage(target);
  if (cursorPage) return cursorPage;

  const visiblePages = getVisibleDocsPages(target);
  return visiblePages[0] ?? null;
};
