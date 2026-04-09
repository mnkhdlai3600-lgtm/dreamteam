import { getSurfaceStylesByTheme } from "./indicator-theme";

type ResolvedTheme = "light" | "dark";

export const buildSuggestionIndicator = (
  container: HTMLDivElement,
  suggestions: string[],
  selectedIndex: number,
  theme: ResolvedTheme,
  onSuggestionClick?: (index: number) => void,
  onFixAll?: () => void,
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
  container.style.borderRadius = "18px";
  container.style.overflow = "hidden";
  container.style.lineHeight = "1.35";
  container.style.maxWidth = "340px";
  container.style.minWidth = "240px";
  container.style.width = "auto";
  container.style.height = "auto";
  container.style.boxShadow = styles.shadowStrong;
  container.style.backdropFilter = "blur(12px)";

  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "4px";
  list.style.padding = "8px";

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

  container.appendChild(list);

  if (suggestions.length > 0 && onFixAll) {
    const actions = document.createElement("div");
    actions.style.padding = "0 8px 8px";
    actions.appendChild(createFixAllButton(styles, onFixAll));
    container.appendChild(actions);
  }

  const hint = document.createElement("div");
  hint.textContent = "↑ ↓ сонгох • Enter эсвэл click";
  hint.style.padding = "10px 14px 12px";
  hint.style.fontSize = "11px";
  hint.style.color = styles.subtleText;
  hint.style.borderTop = `1px solid ${styles.itemBorderActive}`;

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
  const isActive = index === selectedIndex;

  button.type = "button";
  button.textContent = suggestion;
  button.title = suggestion;
  button.setAttribute("data-suggestion-item", "true");
  button.style.border = `1px solid ${
    isActive ? styles.itemBorderActive : "transparent"
  }`;
  button.style.outline = "none";
  button.style.background = isActive ? styles.itemSelected : "transparent";
  button.style.color = styles.panelText;
  button.style.textAlign = "left";
  button.style.padding = "12px 13px";
  button.style.borderRadius = "12px";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.fontWeight = "600";
  button.style.lineHeight = "1.4";
  button.style.width = "100%";
  button.style.whiteSpace = "normal";
  button.style.wordBreak = "break-word";
  button.style.transition =
    "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease";
  button.style.transform = isActive ? "translateY(-1px)" : "translateY(0)";
  button.style.boxShadow = isActive ? styles.focusRing : "none";

  button.addEventListener("mouseenter", () => {
    button.style.background = isActive ? styles.itemSelected : styles.itemHover;
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = isActive ? styles.itemSelected : "transparent";
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

export const updateSuggestionSelection = (
  container: HTMLDivElement,
  selectedIndex: number,
  theme: ResolvedTheme,
) => {
  const styles = getSurfaceStylesByTheme(theme);
  const items = container.querySelectorAll<HTMLButtonElement>(
    '[data-suggestion-item="true"]',
  );

  items.forEach((item, index) => {
    const isActive = index === selectedIndex;
    item.style.background = isActive ? styles.itemSelected : "transparent";
    item.style.borderColor = isActive ? styles.itemBorderActive : "transparent";
    item.style.transform = isActive ? "translateY(-1px)" : "translateY(0)";
    item.style.boxShadow = isActive ? styles.focusRing : "none";
  });
};

export const updateSuggestionHint = (
  container: HTMLDivElement,
  selectedIndex: number,
) => {
  container.setAttribute("data-selected-index", String(selectedIndex));
};

const createFixAllButton = (
  styles: ReturnType<typeof getSurfaceStylesByTheme>,
  onFixAll?: () => void,
) => {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "Бүгдийг засах";
  button.setAttribute("data-fix-all", "true");
  button.style.border = `1px solid ${styles.itemBorderActive}`;
  button.style.outline = "none";
  button.style.background = styles.buttonBackground;
  button.style.color = styles.buttonText;
  button.style.textAlign = "center";
  button.style.padding = "11px 13px";
  button.style.borderRadius = "12px";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.fontWeight = "700";
  button.style.width = "100%";
  button.style.transition =
    "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease";

  button.addEventListener("mouseenter", () => {
    button.style.background = styles.buttonHover;
    button.style.transform = "translateY(-1px)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.background = styles.buttonBackground;
    button.style.transform = "translateY(0)";
  });

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onFixAll?.();
  });

  return button;
};
