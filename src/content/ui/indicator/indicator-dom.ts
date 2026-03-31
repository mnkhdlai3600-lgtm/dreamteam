import { INDICATOR_ID } from "../../constants";

export const clearChildren = (el: HTMLElement) => {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
};

export const getOrCreateIndicator = () => {
  const existing = document.getElementById(
    INDICATOR_ID,
  ) as HTMLDivElement | null;

  if (existing) return existing;

  const container = document.createElement("div");
  container.id = INDICATOR_ID;
  document.body.appendChild(container);

  return container;
};

export const removeIndicator = () => {
  const existing = document.getElementById(INDICATOR_ID);
  if (existing) {
    existing.remove();
  }
};
