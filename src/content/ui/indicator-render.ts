import { INDICATOR_ID } from "../../lib/constants";
import { getCaretClientRect } from "../dom/selection";
import { getIndicatorPosition } from "./indicator-position";

type IndicatorState = "idle" | "loading";

type IndicatorOptions = {
  suggestions?: string[];
  selectedIndex?: number;
  onSuggestionClick?: (index: number) => void;
  state?: IndicatorState;
};

const PANEL_BACKGROUND = "#1f1f1f";
const PANEL_TEXT = "#ffffff";
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";
const ITEM_HOVER = "rgba(255,255,255,0.08)";
const ITEM_SELECTED = "rgba(255,255,255,0.14)";
const SUBTLE_TEXT = "rgba(255,255,255,0.65)";

const clearChildren = (el: HTMLElement) => {
  while (el.firstChild) el.removeChild(el.firstChild);
};

const animateCardOpen = (element: HTMLElement) => {
  element.animate(
    [
      {
        opacity: "0",
        transform: "translateY(6px) scale(0.96)",
      },
      {
        opacity: "1",
        transform: "translateY(0px) scale(1)",
      },
    ],
    {
      duration: 180,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      fill: "forwards",
    },
  );
};

const createBreathingDot = (state: IndicatorState) => {
  const wrapper = document.createElement("div");
  wrapper.style.width = "18px";
  wrapper.style.height = "18px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.pointerEvents = "none";

  const dot = document.createElement("div");
  dot.style.width = state === "loading" ? "9px" : "7px";
  dot.style.height = state === "loading" ? "9px" : "7px";
  dot.style.borderRadius = "999px";
  dot.style.background = "#111827";
  dot.style.border = "2px solid rgba(255,255,255,0.9)";
  dot.style.boxShadow =
    state === "loading"
      ? "0 0 0 0 rgba(17,24,39,0.28), 0 4px 14px rgba(0,0,0,0.20)"
      : "0 4px 12px rgba(0,0,0,0.18)";

  dot.animate(
    state === "loading"
      ? [
          { transform: "scale(0.9)", opacity: 0.55 },
          { transform: "scale(1.18)", opacity: 1 },
          { transform: "scale(0.9)", opacity: 0.55 },
        ]
      : [
          { transform: "scale(0.94)", opacity: 0.45 },
          { transform: "scale(1.08)", opacity: 0.82 },
          { transform: "scale(0.94)", opacity: 0.45 },
        ],
    {
      duration: state === "loading" ? 900 : 1600,
      iterations: Infinity,
      easing: "ease-in-out",
    },
  );

  wrapper.appendChild(dot);
  return wrapper;
};

const buildDotIndicator = (
  container: HTMLDivElement,
  state: IndicatorState,
) => {
  container.dataset.mode = "dot";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.width = "18px";
  container.style.height = "18px";
  container.style.pointerEvents = "none";
  container.style.background = "transparent";
  container.style.border = "none";
  container.style.boxShadow = "none";
  container.style.borderRadius = "999px";
  container.style.overflow = "visible";
  container.style.minWidth = "0";
  container.style.maxWidth = "none";
  container.style.backdropFilter = "none";
  container.style.opacity = "1";
  container.style.transform = "none";

  container.appendChild(createBreathingDot(state));
};

const createSuggestionButton = (
  suggestion: string,
  index: number,
  selectedIndex: number,
  onSuggestionClick?: (index: number) => void,
) => {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = suggestion;
  button.setAttribute("data-suggestion-item", "true");
  button.style.border = "none";
  button.style.outline = "none";
  button.style.background =
    index === selectedIndex ? ITEM_SELECTED : "transparent";
  button.style.color = PANEL_TEXT;
  button.style.textAlign = "left";
  button.style.padding = "10px 12px";
  button.style.borderRadius = "10px";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.width = "100%";
  button.style.transition = "background 0.15s ease";

  button.addEventListener("mouseenter", () => {
    button.style.background =
      index === selectedIndex ? ITEM_SELECTED : ITEM_HOVER;
  });

  button.addEventListener("mouseleave", () => {
    button.style.background =
      index === selectedIndex ? ITEM_SELECTED : "transparent";
  });

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSuggestionClick?.(index);
  });

  return button;
};

const buildSuggestionIndicator = (
  container: HTMLDivElement,
  suggestions: string[],
  selectedIndex: number,
  onSuggestionClick?: (index: number) => void,
) => {
  container.dataset.mode = "suggestion";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.fontFamily = "Inter, Arial, sans-serif";
  container.style.background = PANEL_BACKGROUND;
  container.style.color = PANEL_TEXT;
  container.style.pointerEvents = "auto";
  container.style.border = PANEL_BORDER;
  container.style.borderRadius = "14px";
  container.style.overflow = "hidden";
  container.style.lineHeight = "1.3";
  container.style.maxWidth = "320px";
  container.style.minWidth = "220px";
  container.style.width = "auto";
  container.style.height = "auto";
  container.style.boxShadow = "0 12px 28px rgba(0,0,0,0.28)";
  container.style.backdropFilter = "blur(8px)";

  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.padding = "6px";

  suggestions.forEach((suggestion, index) => {
    list.appendChild(
      createSuggestionButton(
        suggestion,
        index,
        selectedIndex,
        onSuggestionClick,
      ),
    );
  });

  const hint = document.createElement("div");
  hint.textContent = "↑ ↓ сонгох • Enter эсвэл click";
  hint.style.padding = "6px 12px 10px";
  hint.style.fontSize = "11px";
  hint.style.color = SUBTLE_TEXT;

  container.appendChild(list);
  container.appendChild(hint);
};

const getOrCreateIndicator = () => {
  const existing = document.getElementById(
    INDICATOR_ID,
  ) as HTMLDivElement | null;
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = INDICATOR_ID;
  document.body.appendChild(container);
  return container;
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
    INDICATOR_ID,
  ) as HTMLDivElement | null;
  if (!container) return;

  const hasSuggestionList = container.dataset.mode === "suggestion";
  positionIndicator(target, container, hasSuggestionList);
};

export const removeIndicator = () => {
  const existing = document.getElementById(INDICATOR_ID);
  if (existing) existing.remove();
};

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
    buildDotIndicator(container, state);
  }

  positionIndicator(target, container, hasSuggestionList);

  if (hasSuggestionList && previousMode !== "suggestion") {
    animateCardOpen(container);
  }
};
