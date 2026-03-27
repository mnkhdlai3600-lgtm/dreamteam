import { getAccentColor } from "./accents";

const INDICATOR_ID = "bolor-ai-indicator";

export const removeIndicator = () => {
  const existing = document.getElementById(INDICATOR_ID);
  if (existing) existing.remove();
};

export const createIndicator = async (
  target: HTMLElement,
  text = "Bolor AI идэвхтэй",
) => {
  removeIndicator();

  const rect = target.getBoundingClientRect();
  const accentColor = await getAccentColor();

  const div = document.createElement("div");
  div.id = INDICATOR_ID;
  div.textContent = text;
  div.style.position = "fixed";
  div.style.zIndex = "999999";
  div.style.padding = "10px 14px";
  div.style.borderRadius = "12px";
  div.style.background = accentColor;
  div.style.color = "#ffffff";
  div.style.fontSize = "13px";
  div.style.fontFamily = "Arial, sans-serif";
  div.style.boxShadow = "0 10px 24px rgba(0,0,0,0.22)";
  div.style.maxWidth = "320px";
  div.style.whiteSpace = "nowrap";
  div.style.overflow = "hidden";
  div.style.textOverflow = "ellipsis";
  div.style.pointerEvents = "none";
  div.style.lineHeight = "1.3";

  document.body.appendChild(div);

  const spacing = 10;
  const popupHeight = div.offsetHeight;
  const popupWidth = div.offsetWidth;

  let top = rect.bottom + spacing;
  let left = rect.left + rect.width / 2 - popupWidth / 2;

  if (top + popupHeight > window.innerHeight - 8)
    top = rect.top - popupHeight - spacing;
  if (top < 8) top = 8;
  if (left + popupWidth > window.innerWidth - 8)
    left = window.innerWidth - popupWidth - 8;
  if (left < 8) left = 8;

  div.style.top = `${top}px`;
  div.style.left = `${left}px`;
};
