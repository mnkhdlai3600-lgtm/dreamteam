import { getAccentColor } from "./accents";

const INDICATOR_ID = "bolor-ai-indicator";

type IndicatorOptions = {
  suggestions?: string[];
  selectedIndex?: number;
  onSuggestionClick?: (index: number) => void;
};

export const removeIndicator = () => {
  const existing = document.getElementById(INDICATOR_ID);
  if (existing) existing.remove();
};

export const createIndicator = async (
  target: HTMLElement,
  text = "Bolor AI идэвхтэй",
  options: IndicatorOptions = {},
) => {
  removeIndicator();

  const rect = target.getBoundingClientRect();
  const accentColor = await getAccentColor();
  const suggestions = options.suggestions ?? [];
  const hasSuggestionList = suggestions.length > 1;

  const container = document.createElement("div");
  container.id = INDICATOR_ID;
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.boxShadow = "0 10px 24px rgba(0,0,0,0.22)";
  container.style.borderRadius = "14px";
  container.style.overflow = "hidden";
  container.style.maxWidth = "360px";
  container.style.minWidth = hasSuggestionList ? "260px" : "unset";
  container.style.lineHeight = "1.3";

  if (!hasSuggestionList) {
    container.style.background = accentColor;
    container.style.color = "#ffffff";
    container.style.padding = "10px 14px";
    container.style.fontSize = "13px";
    container.style.whiteSpace = "nowrap";
    container.style.overflow = "hidden";
    container.style.textOverflow = "ellipsis";
    container.style.pointerEvents = "none";
    container.textContent = text;
  } else {
    container.style.background = "#ffffff";
    container.style.color = "#111111";
    container.style.pointerEvents = "auto";
    container.style.border = "1px solid rgba(0,0,0,0.08)";

    const header = document.createElement("div");
    header.textContent = text;
    header.style.background = accentColor;
    header.style.color = "#ffffff";
    header.style.padding = "10px 12px";
    header.style.fontSize = "13px";
    header.style.fontWeight = "600";
    header.style.borderBottom = "1px solid rgba(255,255,255,0.15)";
    header.style.whiteSpace = "nowrap";
    header.style.overflow = "hidden";
    header.style.textOverflow = "ellipsis";

    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.maxHeight = "220px";
    list.style.overflowY = "auto";
    list.style.padding = "6px";

    suggestions.forEach((suggestion, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = suggestion;

      button.style.border = "none";
      button.style.outline = "none";
      button.style.background =
        index === (options.selectedIndex ?? 0)
          ? "rgba(0,0,0,0.08)"
          : "transparent";
      button.style.color = "#111111";
      button.style.textAlign = "left";
      button.style.padding = "10px 12px";
      button.style.borderRadius = "10px";
      button.style.cursor = "pointer";
      button.style.fontSize = "13px";
      button.style.width = "100%";
      button.style.transition = "background 0.15s ease";

      button.addEventListener("mouseenter", () => {
        button.style.background = "rgba(0,0,0,0.06)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.background =
          index === (options.selectedIndex ?? 0)
            ? "rgba(0,0,0,0.08)"
            : "transparent";
      });

      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        options.onSuggestionClick?.(index);
      });

      list.appendChild(button);
    });

    container.appendChild(header);
    container.appendChild(list);
  }

  document.body.appendChild(container);

  const spacing = 10;
  const popupHeight = container.offsetHeight;
  const popupWidth = container.offsetWidth;

  let top = rect.bottom + spacing;
  let left = rect.left + rect.width / 2 - popupWidth / 2;

  if (top + popupHeight > window.innerHeight - 8) {
    top = rect.top - popupHeight - spacing;
  }

  if (top < 8) top = 8;
  if (left + popupWidth > window.innerWidth - 8) {
    left = window.innerWidth - popupWidth - 8;
  }
  if (left < 8) left = 8;

  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
};
