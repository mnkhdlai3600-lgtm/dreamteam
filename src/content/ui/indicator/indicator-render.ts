import { getIndicatorPosition } from "./indicator-position";
import {
  animateCardOpen,
  buildSuggestionIndicator,
  updateSuggestionSelection,
  updateSuggestionHint,
} from "./indicator-card";
import {
  clearChildren,
  getOrCreateIndicator,
  removeIndicator,
} from "./indicator-dom";
import { buildDotIndicator, type IndicatorState } from "./indicator-dot";
import { getResolvedTheme } from "./indicator-theme";

type IndicatorOptions = {
  suggestions?: string[];
  selectedIndex?: number;
  onSuggestionClick?: (index: number) => void;
  onFixAll?: () => void;
  state?: IndicatorState;
};

let indicatorRenderToken = 0;

const getTextEndRectForInput = (
  el: HTMLInputElement | HTMLTextAreaElement,
): DOMRect => {
  const div = document.createElement("div");
  const style = window.getComputedStyle(el);

  const properties = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "letterSpacing",
    "textTransform",
    "textAlign",
    "textIndent",
    "textDecoration",
    "textRendering",
    "wordSpacing",
    "whiteSpace",
  ] as const;

  div.style.position = "fixed";
  div.style.left = "-9999px";
  div.style.top = "0";
  div.style.visibility = "hidden";
  div.style.pointerEvents = "none";
  div.style.whiteSpace = el instanceof HTMLTextAreaElement ? "pre-wrap" : "pre";
  div.style.wordWrap = "break-word";

  for (const prop of properties) {
    div.style[prop] = style[prop];
  }

  div.textContent = el.value ?? "";

  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  div.appendChild(marker);

  document.body.appendChild(div);

  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = div.getBoundingClientRect();
  const inputRect = el.getBoundingClientRect();
  const lineHeight = parseFloat(style.lineHeight) || inputRect.height * 0.6;

  const rect = new DOMRect(
    inputRect.left + (markerRect.left - mirrorRect.left) - el.scrollLeft,
    inputRect.top + (markerRect.top - mirrorRect.top) - el.scrollTop,
    1,
    lineHeight,
  );

  document.body.removeChild(div);

  return rect;
};

const getTextEndRectForEditable = (el: HTMLElement): DOMRect => {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);

  const rects = range.getClientRects();
  if (rects.length > 0) {
    return rects[rects.length - 1];
  }

  return el.getBoundingClientRect();
};

const getTextEndAnchorRect = (target: HTMLElement): DOMRect => {
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return getTextEndRectForInput(target);
  }

  return getTextEndRectForEditable(target);
};

const positionDotIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
) => {
  const anchorRect = getTextEndAnchorRect(target);
  const viewportPadding = 8;
  const gap = 6;

  let top = anchorRect.top + anchorRect.height / 2 - container.offsetHeight / 2;
  let left = anchorRect.right + gap;

  if (left + container.offsetWidth > window.innerWidth - viewportPadding) {
    left = anchorRect.left - container.offsetWidth - gap;
  }

  if (left < viewportPadding) left = viewportPadding;
  if (top < viewportPadding) top = viewportPadding;

  if (top + container.offsetHeight > window.innerHeight - viewportPadding) {
    top = window.innerHeight - container.offsetHeight - viewportPadding;
  }

  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
};

const positionSuggestionIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
) => {
  const anchorRect = getTextEndAnchorRect(target);
  const { top, left } = getIndicatorPosition(
    anchorRect,
    container.offsetWidth,
    container.offsetHeight,
    true,
  );

  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
};

const positionIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
  hasSuggestionList: boolean,
) => {
  if (hasSuggestionList) {
    positionSuggestionIndicator(target, container);
    return;
  }

  positionDotIndicator(target, container);
};

const canReuseSuggestionContainer = (
  container: HTMLDivElement,
  suggestions: string[],
) => {
  if (container.dataset.mode !== "suggestion") return false;

  const currentItems = Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '[data-suggestion-item="true"]',
    ),
  ).map((item) => item.textContent ?? "");

  if (currentItems.length !== suggestions.length) return false;

  return currentItems.every((item, index) => item === suggestions[index]);
};

export const updateIndicatorPosition = (target: HTMLElement) => {
  const container = document.getElementById(
    "bolor-ai-indicator",
  ) as HTMLDivElement | null;

  if (!container) return;

  const hasSuggestionList = container.dataset.mode === "suggestion";
  positionIndicator(target, container, hasSuggestionList);
};

export { removeIndicator };

export const createIndicator = async (
  target: HTMLElement,
  _text = "",
  options: IndicatorOptions = {},
) => {
  const renderToken = ++indicatorRenderToken;

  const suggestions = options.suggestions ?? [];
  const hasSuggestionList = suggestions.length > 0;
  const selectedIndex = options.selectedIndex ?? 0;
  const state = options.state ?? "idle";

  const container = getOrCreateIndicator();
  container.style.transition =
    "top 120ms ease-out, left 120ms ease-out, opacity 160ms ease-out, transform 160ms ease-out";
  container.style.willChange = "top, left, transform, opacity";

  const previousMode = container.dataset.mode;

  if (hasSuggestionList) {
    const theme = await getResolvedTheme();
    if (renderToken !== indicatorRenderToken) return;
    if (!container.isConnected) return;

    if (canReuseSuggestionContainer(container, suggestions)) {
      updateSuggestionSelection(container, selectedIndex, theme);
      updateSuggestionHint(container, selectedIndex);
      positionIndicator(target, container, true);
      return;
    }

    container.dataset.mode = "suggestion";
    clearChildren(container);

    buildSuggestionIndicator(
      container,
      suggestions,
      selectedIndex,
      theme,
      options.onSuggestionClick,
      options.onFixAll,
    );

    if (renderToken !== indicatorRenderToken) return;
    if (!container.isConnected) return;
    if (container.dataset.mode !== "suggestion") return;

    positionIndicator(target, container, true);

    if (previousMode !== "suggestion") {
      animateCardOpen(container);
    }

    return;
  }

  container.dataset.mode = "dot";
  clearChildren(container);

  await buildDotIndicator(container, state);

  if (renderToken !== indicatorRenderToken) return;
  if (!container.isConnected) return;
  if (container.dataset.mode !== "dot") return;

  positionIndicator(target, container, false);
};
