import { getIndicatorPosition } from "./indicator-position";
import { getTextEndAnchorRect } from "./indicator-anchor";

const applyPosition = (
  target: HTMLElement,
  container: HTMLDivElement,
  hasSuggestionList: boolean,
) => {
  const anchorRect = getTextEndAnchorRect(target);
  const { top, left } = getIndicatorPosition(
    anchorRect,
    container.offsetWidth,
    container.offsetHeight,
    hasSuggestionList,
  );

  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
};

export const positionDotIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
) => {
  applyPosition(target, container, false);
  console.log("[болор][position-target]", target);
  console.log("[болор][anchor-rect]", getTextEndAnchorRect(target));
};

export const positionSuggestionIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
) => {
  applyPosition(target, container, true);
};

export const positionIndicator = (
  target: HTMLElement,
  container: HTMLDivElement,
  hasSuggestionList: boolean,
) => {
  applyPosition(target, container, hasSuggestionList);
};

export const canReuseSuggestionContainer = (
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
