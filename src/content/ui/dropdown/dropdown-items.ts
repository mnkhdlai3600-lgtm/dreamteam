import {
  latestSuggestions,
  setSelectedSuggestionIndex,
  shouldApplyFullTextSuggestion,
} from "../../core/state";
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

const isLargeFullTextSuggestion = (text: string) => {
  const normalized = text
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .trim();

  if (!normalized) return false;
  if (normalized.includes("\n")) return true;
  if (normalized.length >= 80) return true;

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return wordCount >= 8;
};

export const createLoadingRow = async () => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.flexDirection = "column";
  row.style.gap = "8px";
  row.style.padding = "12px";
  row.style.borderRadius = "14px";
  row.style.border = `1px solid ${styles.itemBorderActive}`;
  row.style.background = styles.itemHover;
  row.style.boxSizing = "border-box";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "10px";

  const spinner = document.createElement("div");
  spinner.style.width = "16px";
  spinner.style.height = "16px";
  spinner.style.borderRadius = "9999px";
  spinner.style.border = `2px solid ${styles.spinnerTrack}`;
  spinner.style.borderTopColor = styles.spinnerHead;
  spinner.style.animation = "bolor-ai-spin 0.8s linear infinite";
  spinner.style.flexShrink = "0";

  const titleWrap = document.createElement("div");
  titleWrap.style.display = "flex";
  titleWrap.style.flexDirection = "column";
  titleWrap.style.gap = "2px";
  titleWrap.style.minWidth = "0";

  const title = document.createElement("div");
  title.textContent = "Шалгаж байна...";
  title.style.color = styles.panelText;
  title.style.fontSize = "13px";
  title.style.fontWeight = "700";
  title.style.lineHeight = "1.35";

  const sub = document.createElement("div");
  sub.textContent = "Санал бэлдэж байна";
  sub.style.color = styles.subtleText;
  sub.style.fontSize = "11px";
  sub.style.lineHeight = "1.35";

  titleWrap.appendChild(title);
  titleWrap.appendChild(sub);
  header.appendChild(spinner);
  header.appendChild(titleWrap);
  row.appendChild(header);

  return row;
};

export const createSuggestionItem = async (
  suggestion: string,
  index: number,
  onPick: (value: string) => void,
) => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);
  const isFixAllOnly =
    shouldApplyFullTextSuggestion && isLargeFullTextSuggestion(suggestion);

  const item = document.createElement("div");
  item.setAttribute("role", "button");
  item.setAttribute("tabindex", "-1");
  item.dataset.suggestionItem = "true";
  item.dataset.suggestionValue = suggestion;
  item.title = isFixAllOnly ? "Бүгдийг засах" : suggestion;

  item.style.width = "100%";
  item.style.display = "block";
  item.style.boxSizing = "border-box";
  item.style.textAlign = "left";
  item.style.padding = "12px 14px";
  item.style.margin = "0";
  item.style.borderRadius = "14px";
  item.style.border = "1px solid transparent";
  item.style.background = "transparent";
  item.style.color = styles.panelText;
  item.style.cursor = "pointer";
  item.style.outline = "none";
  item.style.userSelect = "none";
  item.style.webkitUserSelect = "none";
  item.style.pointerEvents = "auto";
  item.style.transition =
    "background 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease";

  const text = document.createElement("div");
  text.textContent = isFixAllOnly ? "Бүгдийг засах" : suggestion;
  text.style.fontSize = "14px";
  text.style.fontWeight = "700";
  text.style.lineHeight = "1.45";
  text.style.wordBreak = "break-word";
  text.style.whiteSpace = "normal";
  text.style.color = styles.panelText;

  item.appendChild(text);

  if (isFixAllOnly) {
    const sub = document.createElement("div");
    sub.textContent = "Галиг текстийг бүтнээр нь кирилл болгох";
    sub.style.marginTop = "4px";
    sub.style.fontSize = "12px";
    sub.style.lineHeight = "1.4";
    sub.style.color = styles.subtleText;
    sub.style.wordBreak = "break-word";
    sub.style.whiteSpace = "normal";
    item.appendChild(sub);
  }

  item.addEventListener("mouseenter", () => {
    setSelectedSuggestionIndex(index);
    void refreshSuggestionDropdownHighlight();
  });

  item.addEventListener(
    "pointerdown",
    (event) => {
      event.stopPropagation();
    },
    true,
  );

  item.addEventListener(
    "mousedown",
    (event) => {
      event.stopPropagation();
    },
    true,
  );

  item.addEventListener(
    "click",
    (event) => {
      stopEvent(event);

      if (!startPickingSuggestion()) return;

      try {
        setSelectedSuggestionIndex(index);
        onPick(suggestion);
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
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "space-between";
  footer.style.gap = "10px";
  footer.style.fontSize = "11px";
  footer.style.color = styles.subtleText;
  footer.style.padding = "10px 12px 6px";
  footer.style.marginTop = "6px";
  footer.style.borderTop = `1px solid ${styles.itemBorderActive}`;

  const isFixAllOnly =
    shouldApplyFullTextSuggestion && latestSuggestions.length === 1;

  const label = document.createElement("div");
  label.textContent = isFixAllOnly ? "Нэг үйлдэл" : "↑ ↓ сонгох";

  const action = document.createElement("div");
  action.textContent = isFixAllOnly
    ? "Enter дарж бүгдийг засах"
    : "Enter дарж хэрэглэх";
  action.style.fontWeight = "600";

  footer.appendChild(label);
  footer.appendChild(action);

  return footer;
};
