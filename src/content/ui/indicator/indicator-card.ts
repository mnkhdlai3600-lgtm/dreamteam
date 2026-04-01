import {
  getSurfaceStylesByTheme,
  type getResolvedTheme,
} from "./indicator-theme";

type ResolvedTheme = Awaited<ReturnType<typeof getResolvedTheme>>;

export const buildSuggestionIndicator = (
  container: HTMLDivElement,
  suggestions: string[],
  selectedIndex: number,
  theme: ResolvedTheme,
  onSuggestionClick?: (index: number) => void,
) => {
  const styles = getSurfaceStylesByTheme(theme);

  container.dataset.mode = "suggestion";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.fontFamily = "Inter, Arial, sans-serif";
  container.style.background = styles.panelBackground;
  container.style.color = styles.panelText;
  container.style.pointerEvents = "auto";
  container.style.border = styles.panelBorder;
  container.style.borderRadius = "14px";
  container.style.overflow = "hidden";
  container.style.lineHeight = "1.3";
  container.style.maxWidth = "320px";
  container.style.minWidth = "220px";
  container.style.width = "auto";
  container.style.height = "auto";
  container.style.boxShadow = styles.shadow;
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
        styles,
        onSuggestionClick,
      ),
    );
  });

  const hint = document.createElement("div");
  hint.textContent = "↑ ↓ сонгох • Enter эсвэл click";
  hint.style.padding = "6px 12px 10px";
  hint.style.fontSize = "11px";
  hint.style.color = styles.subtleText;

  container.appendChild(list);
  container.appendChild(hint);
};

export const animateCardOpen = (element: HTMLElement) => {
  element.animate(
    [
      { opacity: "0", transform: "translateY(6px) scale(0.96)" },
      { opacity: "1", transform: "translateY(0px) scale(1)" },
    ],
    {
      duration: 180,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      fill: "forwards",
    },
  );
};

const createSuggestionButton = (
  suggestion: string,
  index: number,
  selectedIndex: number,
  styles: ReturnType<typeof getSurfaceStylesByTheme>,
  onSuggestionClick?: (index: number) => void,
) => {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = suggestion;
  button.setAttribute("data-suggestion-item", "true");
  button.style.border = "none";
  button.style.outline = "none";
  button.style.background =
    index === selectedIndex ? styles.itemSelected : "transparent";
  button.style.color = styles.panelText;
  button.style.textAlign = "left";
  button.style.padding = "10px 12px";
  button.style.borderRadius = "10px";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.width = "100%";
  button.style.transition = "background 0.15s ease";

  button.addEventListener("mouseenter", () => {
    button.style.background =
      index === selectedIndex ? styles.itemSelected : styles.itemHover;
  });

  button.addEventListener("mouseleave", () => {
    button.style.background =
      index === selectedIndex ? styles.itemSelected : "transparent";
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
