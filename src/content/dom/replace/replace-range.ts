import { normalizeComparableText } from "./replace-core";

const getTextNodes = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      nodes.push(current as Text);
    }
    current = walker.nextNode();
  }

  return nodes;
};

const buildRangeFromOffsets = (
  root: HTMLElement,
  start: number,
  end: number,
): Range | null => {
  if (end <= start) return null;

  const textNodes = getTextNodes(root);
  if (!textNodes.length) return null;

  let cursor = 0;
  let startNode: Text | null = null;
  let endNode: Text | null = null;
  let startOffset = 0;
  let endOffset = 0;

  for (const node of textNodes) {
    const length = node.textContent?.length ?? 0;
    const nextCursor = cursor + length;

    if (!startNode && start >= cursor && start <= nextCursor) {
      startNode = node;
      startOffset = Math.max(0, start - cursor);
    }

    if (!endNode && end >= cursor && end <= nextCursor) {
      endNode = node;
      endOffset = Math.max(0, end - cursor);
    }

    cursor = nextCursor;
  }

  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
};

const tryBuildExactWordRange = (root: HTMLElement, expectedWord: string) => {
  const normalizedExpected = normalizeComparableText(expectedWord);
  if (!normalizedExpected) return null;

  for (const node of getTextNodes(root)) {
    const text = node.textContent ?? "";
    const index = text.indexOf(expectedWord);

    if (index >= 0) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + expectedWord.length);
      return range;
    }

    const normalizedText = normalizeComparableText(text);
    const normalizedIndex = normalizedText.indexOf(normalizedExpected);

    if (normalizedIndex >= 0 && normalizedText.length === text.length) {
      const range = document.createRange();
      range.setStart(node, normalizedIndex);
      range.setEnd(node, normalizedIndex + expectedWord.length);
      return range;
    }
  }

  return null;
};

export const resolveReplaceRange = (
  root: HTMLElement,
  start: number,
  end: number,
  expectedWord?: string,
) => {
  const directRange = buildRangeFromOffsets(root, start, end);

  if (!expectedWord) return directRange;

  const normalizedExpected = normalizeComparableText(expectedWord);

  if (directRange) {
    const selectedText = normalizeComparableText(directRange.toString());
    if (selectedText === normalizedExpected) return directRange;

    const shiftedLeft = buildRangeFromOffsets(
      root,
      Math.max(0, start - 1),
      Math.max(0, end - 1),
    );
    if (
      shiftedLeft &&
      normalizeComparableText(shiftedLeft.toString()) === normalizedExpected
    ) {
      return shiftedLeft;
    }

    const shiftedRight = buildRangeFromOffsets(root, start + 1, end + 1);
    if (
      shiftedRight &&
      normalizeComparableText(shiftedRight.toString()) === normalizedExpected
    ) {
      return shiftedRight;
    }
  }

  return tryBuildExactWordRange(root, expectedWord) ?? directRange;
};

export const focusErrorRangeByOffsets = (
  root: HTMLElement,
  start: number,
  end: number,
  expectedWord?: string,
) => {
  const selection = window.getSelection();
  if (!selection) return false;

  const range = resolveReplaceRange(root, start, end, expectedWord);
  if (!range) return false;

  root.focus();
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
};
