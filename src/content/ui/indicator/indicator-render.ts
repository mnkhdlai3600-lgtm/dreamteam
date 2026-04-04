import {
  animateCardOpen,
  buildSuggestionIndicator,
  updateSuggestionHint,
  updateSuggestionSelection,
} from "./indicator-card";
import {
  clearChildren,
  getOrCreateIndicator,
  removeIndicator,
} from "./indicator-dom";
import { buildDotIndicator } from "./indicator-dot";
import { getResolvedTheme } from "./indicator-theme";
import {
  canReuseSuggestionContainer,
  positionIndicator,
} from "./indicator-layout";
import type { IndicatorOptions } from "./indicator-types";

let indicatorRenderToken = 0;
let lastDotState: import("./indicator-dot").IndicatorState | null = null;
let lastDotErrorCount: number | null = null;

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
  const errorCount = options.errorCount ?? 0;

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

  const shouldReuseDot =
    previousMode === "dot" &&
    lastDotState === state &&
    lastDotErrorCount === errorCount &&
    container.childElementCount > 0;

  if (!shouldReuseDot) {
    clearChildren(container);
    await buildDotIndicator(container, state, errorCount, options.onDotClick);

    if (renderToken !== indicatorRenderToken) return;
    if (!container.isConnected) return;
    if (container.dataset.mode !== "dot") return;

    lastDotState = state;
    lastDotErrorCount = errorCount;
  }

  positionIndicator(target, container, false);
};
