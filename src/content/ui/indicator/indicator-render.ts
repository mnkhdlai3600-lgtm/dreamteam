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

const positionIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
  hasSuggestionList: boolean,
) => {
  const caretRect =
    getCaretClientRect(target) ?? target.getBoundingClientRect();

  const { top, left } = getIndicatorPosition(
    caretRect,
    container.offsetWidth,
    container.offsetHeight,
    hasSuggestionList,
  );

  if (hasSuggestionList) {
    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    return;
  }

  const dotOffsetX = 10;
  const dotOffsetY = 0;

  container.style.top = `${top + dotOffsetY}px`;
  container.style.left = `${left + dotOffsetX}px`;
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
    buildSuggestionIndicator(
      container,
      suggestions,
      selectedIndex,
      options.onSuggestionClick,
    );
  } else {
    await buildDotIndicator(container, state);
  }

  positionIndicator(target, container, hasSuggestionList);

  if (hasSuggestionList && previousMode !== "suggestion") {
    animateCardOpen(container);
  }
};
