import { setSelectedSuggestionIndex } from "../../core/state";
import {
  getResolvedTheme,
  getSurfaceStylesByTheme,
} from "../indicator/indicator-theme";
import { refreshSuggestionDropdownHighlight } from "./dropdown-highlight";
import {
  finishPickingSuggestion,
  startPickingSuggestion,
  stopEvent,
} from "./dropdown-state";

export const createLoadingRow = async () => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  row.style.padding = "10px 12px";

  const spinner = document.createElement("div");
  spinner.style.width = "16px";
  spinner.style.height = "16px";
  spinner.style.borderRadius = "9999px";
  spinner.style.border = `2px solid ${styles.spinnerTrack}`;
  spinner.style.borderTopColor = styles.spinnerHead;
  spinner.style.animation = "bolor-ai-spin 0.8s linear infinite";

  const label = document.createElement("div");
  label.textContent = "Шалгаж байна...";
  label.style.color = styles.panelText;

  row.appendChild(spinner);
  row.appendChild(label);
  return row;
};

export const createSuggestionItem = async (
  suggestion: string,
  index: number,
  onPick: (value: string) => void,
) => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const item = document.createElement("div");
  item.setAttribute("role", "button");
  item.setAttribute("tabindex", "-1");
  item.dataset.suggestionItem = "true";
  item.dataset.suggestionValue = suggestion;
  item.textContent = suggestion;
  item.title = suggestion;

  item.style.width = "100%";
  item.style.display = "block";
  item.style.textAlign = "left";
  item.style.padding = "10px 12px";
  item.style.margin = "0";
  item.style.borderRadius = "10px";
  item.style.border = "1px solid transparent";
  item.style.background = "transparent";
  item.style.color = styles.panelText;
  item.style.cursor = "pointer";
  item.style.outline = "none";
  item.style.fontSize = "13px";
  item.style.lineHeight = "1.35";
  item.style.whiteSpace = "nowrap";
  item.style.overflow = "hidden";
  item.style.textOverflow = "ellipsis";
  item.style.userSelect = "none";
  item.style.webkitUserSelect = "none";
  item.style.pointerEvents = "auto";

  item.addEventListener("mouseenter", () => {
    console.log("[болор][dropdown-item] mouseenter", {
      suggestion,
      index,
    });
    setSelectedSuggestionIndex(index);
    void refreshSuggestionDropdownHighlight();
  });

  item.addEventListener(
    "pointerdown",
    (event) => {
      console.log("[болор][dropdown-item] pointerdown", {
        suggestion,
        index,
      });
      event.stopPropagation();
    },
    true,
  );

  item.addEventListener(
    "mousedown",
    (event) => {
      console.log("[болор][dropdown-item] mousedown", {
        suggestion,
        index,
      });
      event.stopPropagation();
    },
    true,
  );

  item.addEventListener(
    "click",
    (event) => {
      console.log("[болор][dropdown-item] click", {
        suggestion,
        index,
      });

      stopEvent(event);

      if (!startPickingSuggestion()) return;

      try {
        setSelectedSuggestionIndex(index);

        console.log("[болор][dropdown-item] before onPick", {
          suggestion,
          index,
        });

        onPick(suggestion);

        console.log("[болор][dropdown-item] after onPick", {
          suggestion,
          index,
        });
      } finally {
        finishPickingSuggestion();
      }
    },
    true,
  );

  return item;
};

export const createFooter = async () => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const footer = document.createElement("div");
  footer.textContent = "↑ ↓ сонгох • Enter эсвэл click";
  footer.style.fontSize = "11px";
  footer.style.color = styles.subtleText;
  footer.style.padding = "8px 12px 4px";

  return footer;
};
