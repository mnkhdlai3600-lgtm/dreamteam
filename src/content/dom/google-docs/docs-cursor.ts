import { DOCS_CURSOR_SELECTORS, isVisibleDocsRect } from "./docs-core";

export const getGoogleDocsCursorElement = (): HTMLElement | null => {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(DOCS_CURSOR_SELECTORS),
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    return (
      isVisibleDocsRect(rect) &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  });

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();

    if (br.top !== ar.top) return br.top - ar.top;
    return br.left - ar.left;
  });

  return candidates[0] ?? null;
};

export const getGoogleDocsCursorRect = (): DOMRect | null => {
  const cursor = getGoogleDocsCursorElement();
  if (!cursor) return null;

  const rect = cursor.getBoundingClientRect();
  if (!isVisibleDocsRect(rect)) return null;

  return new DOMRect(
    rect.right || rect.left,
    rect.top,
    1,
    Math.max(1, rect.height),
  );
};
