import { getIndicatorPosition } from "./indicator-position";
import { getTextEndAnchorRect } from "./indicator-anchor";

export const positionDotIndicator = (
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

export const positionSuggestionIndicator = (
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

export const positionIndicator = (
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
