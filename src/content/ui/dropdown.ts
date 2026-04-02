import {
  isSuggestionLoading,
  latestSuggestions,
  selectedSuggestionIndex,
  setIsSuggestionMenuOpen,
  setSelectedSuggestionIndex,
} from "../core/state";
import {
  createDropdownElement,
  ensureDropdownStyles,
  getAllDropdownElements,
  getDropdownElement,
} from "./dropdown-dom";
import {
  hasDropdownAnchor,
  repositionSuggestionDropdown,
} from "./dropdown-position";
import {
  getResolvedTheme,
  getSurfaceStylesByTheme,
} from "./indicator/indicator-theme";

let dropdownRenderToken = 0;

export const refreshSuggestionDropdownHighlight = async () => {
  const dropdown = getDropdownElement();
  if (!dropdown) return;

  const theme =
    (dropdown.dataset.theme as "light" | "dark" | undefined) ??
    (await getResolvedTheme());
  const styles = getSurfaceStylesByTheme(theme);

  const items = dropdown.querySelectorAll<HTMLElement>(
    "[data-suggestion-item]",
  );
  if (!items.length) return;

  items.forEach((item, index) => {
    const isActive = index === selectedSuggestionIndex;
    item.style.background = isActive ? styles.itemSelected : "transparent";
    item.style.borderColor = isActive ? styles.itemBorderActive : "transparent";

    if (isActive) {
      item.scrollIntoView({ block: "nearest" });
    }
  });
};

export const removeSuggestionDropdown = () => {
  getAllDropdownElements().forEach((element) => element.remove());
  setIsSuggestionMenuOpen(false);
};

const createLoadingRow = async () => {
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

const createSuggestionItem = async (
  suggestion: string,
  index: number,
  onPick: (value: string) => void,
) => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const item = document.createElement("button");
  item.type = "button";
  item.textContent = suggestion;
  item.dataset.suggestionItem = "true";

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

  item.addEventListener("mouseenter", () => {
    setSelectedSuggestionIndex(index);
    void refreshSuggestionDropdownHighlight();
  });

  item.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onPick(suggestion);
  });

  return item;
};

const createFooter = async () => {
  const theme = await getResolvedTheme();
  const styles = getSurfaceStylesByTheme(theme);

  const footer = document.createElement("div");
  footer.textContent = "↑ ↓ сонгох • Enter эсвэл click";
  footer.style.fontSize = "11px";
  footer.style.color = styles.subtleText;
  footer.style.padding = "8px 12px 4px";

  return footer;
};

export const renderSuggestionDropdown = async (
  onPick: (value: string) => void,
) => {
  const renderToken = ++dropdownRenderToken;

  ensureDropdownStyles();
  removeSuggestionDropdown();

  if (!hasDropdownAnchor()) return;
  if (!isSuggestionLoading && !latestSuggestions.length) return;

  const dropdown = await createDropdownElement();

  if (renderToken !== dropdownRenderToken) return;
  if (!hasDropdownAnchor()) return;

  if (isSuggestionLoading) {
    dropdown.appendChild(await createLoadingRow());
  } else {
    for (let index = 0; index < latestSuggestions.length; index += 1) {
      const suggestion = latestSuggestions[index];
      dropdown.appendChild(
        await createSuggestionItem(suggestion, index, onPick),
      );

      if (renderToken !== dropdownRenderToken) return;
    }

    dropdown.appendChild(await createFooter());
  }

  if (renderToken !== dropdownRenderToken) return;

  removeSuggestionDropdown();
  document.body.appendChild(dropdown);
  setIsSuggestionMenuOpen(true);
  repositionSuggestionDropdown();
  void refreshSuggestionDropdownHighlight();
};
