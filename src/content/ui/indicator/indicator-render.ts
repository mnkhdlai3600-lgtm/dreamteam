import { getCaretClientRect } from "../../dom";
import { getIndicatorPosition } from "./indicator-position";
import { animateCardOpen, buildSuggestionIndicator } from "./indicator-card";
import {
  clearChildren,
  getOrCreateIndicator,
  removeIndicator,
} from "./indicator-dom";
import { buildDotIndicator, type IndicatorState } from "./indicator-dot";

type IndicatorOptions = {
  suggestions?: string[];
  selectedIndex?: number;
  onSuggestionClick?: (index: number) => void;
  state?: IndicatorState;
};

let indicatorRenderToken = 0;

const getDotAnchorRect = (target: HTMLElement) => {
  const caretRect = getCaretClientRect(target);
  const fallbackRect = target.getBoundingClientRect();

  return caretRect ?? fallbackRect;
};

const positionDotIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
) => {
  const anchorRect = getDotAnchorRect(target);
  const viewportPadding = 8;
  const gap = 8;

  let top = anchorRect.top + anchorRect.height / 2 - container.offsetHeight / 2;
  let left = anchorRect.right + gap;

  if (left + container.offsetWidth > window.innerWidth - viewportPadding) {
    left = anchorRect.left - container.offsetWidth - gap;
  }

  if (left < viewportPadding) {
    left = viewportPadding;
  }

  if (top < viewportPadding) {
    top = viewportPadding;
  }

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
  const anchorRect = target.getBoundingClientRect();

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

  clearChildren(container);

  if (hasSuggestionList) {
    container.dataset.mode = "suggestion";

    buildSuggestionIndicator(
      container,
      suggestions,
      selectedIndex,
      options.onSuggestionClick,
    );

    if (renderToken !== indicatorRenderToken) return;
    positionIndicator(target, container, true);

    if (previousMode !== "suggestion") {
      animateCardOpen(container);
    }

    return;
  }

  container.dataset.mode = "dot";

  await buildDotIndicator(container, state);

  if (renderToken !== indicatorRenderToken) return;
  if (!container.isConnected) return;
  if (container.dataset.mode !== "dot") return;

  positionIndicator(target, container, false);
};
