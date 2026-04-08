import { canInlineHighlight, getHighlightTarget } from "./target";
import { findWordRange } from "./utils";

const MARK_ATTR = "data-bolor-highlight";

export const wrapNextMatch = (
  root: HTMLElement,
  word: string,
  className: string,
  id: string,
) => {
  const target = getHighlightTarget(root);

  if (!canInlineHighlight(target)) return false;

  const trimmed = word.trim();
  if (!trimmed) return false;

  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentEl = node.parentElement;

      if (!parentEl) return NodeFilter.FILTER_REJECT;
      if (parentEl.closest(`[${MARK_ATTR}="true"]`)) {
        return NodeFilter.FILTER_REJECT;
      }

      const value = node.nodeValue || "";
      if (!value.trim()) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let textNode: Text | null = null;

  while ((textNode = walker.nextNode() as Text | null)) {
    const text = textNode.nodeValue || "";
    const rangeInfo = findWordRange(text, trimmed);

    if (!rangeInfo) continue;

    const range = document.createRange();
    range.setStart(textNode, rangeInfo.start);
    range.setEnd(textNode, rangeInfo.end);

    const span = document.createElement("span");
    span.className = className;
    span.setAttribute(MARK_ATTR, "true");
    span.dataset.bolorErrorId = id;

    try {
      range.surroundContents(span);
      return true;
    } catch {
      return false;
    }
  }

  return false;
};
