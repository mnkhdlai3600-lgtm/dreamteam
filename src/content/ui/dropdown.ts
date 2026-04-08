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

console.log("DROPDOWN FILE LOADED 777");

let dropdownRenderToken = 0;
let isPickingSuggestion = false;

const stopEvent = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  if ("stopImmediatePropagation" in event) {
    event.stopImmediatePropagation();
  }
};

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
  console.log("[болор][dropdown] removeSuggestionDropdown");
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

      if (isPickingSuggestion) return;
      isPickingSuggestion = true;

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
        window.setTimeout(() => {
          isPickingSuggestion = false;
        }, 0);
      }
    },
    true,
  );

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

const refreshDropdownPositionStable = (renderToken: number) => {
  if (renderToken !== dropdownRenderToken) return;

  repositionSuggestionDropdown();

  requestAnimationFrame(() => {
    if (renderToken !== dropdownRenderToken) return;
    repositionSuggestionDropdown();

    window.setTimeout(() => {
      if (renderToken !== dropdownRenderToken) return;
      repositionSuggestionDropdown();
    }, 30);
  });
};

export const renderSuggestionDropdown = async (
  onPick: (value: string) => void,
) => {
  const renderToken = ++dropdownRenderToken;

  console.log("[болор][dropdown] render start", {
    renderToken,
    isSuggestionLoading,
    latestSuggestions,
    hasAnchor: hasDropdownAnchor(),
  });

  ensureDropdownStyles();
  removeSuggestionDropdown();

  if (!hasDropdownAnchor()) {
    console.log("[болор][dropdown] no anchor");
    return;
  }

  if (!isSuggestionLoading && !latestSuggestions.length) {
    console.log("[болор][dropdown] no suggestions and not loading");
    return;
  }

  const dropdown = await createDropdownElement();

  console.log("[болор][dropdown] element created", {
    renderToken,
    dropdown,
  });

  if (renderToken !== dropdownRenderToken) return;
  if (!hasDropdownAnchor()) {
    console.log("[болор][dropdown] anchor lost after create");
    return;
  }

  dropdown.tabIndex = -1;
  dropdown.setAttribute("data-bolor-dropdown", "true");
  dropdown.style.pointerEvents = "auto";

  dropdown.addEventListener(
    "pointerdown",
    (event) => {
      console.log("[болор][dropdown] container pointerdown");
      event.stopPropagation();
    },
    true,
  );

  dropdown.addEventListener(
    "mousedown",
    (event) => {
      console.log("[болор][dropdown] container mousedown");
      event.stopPropagation();
    },
    true,
  );

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

  console.log("[болор][dropdown] appended", {
    renderToken,
    childCount: dropdown.childElementCount,
  });

  refreshDropdownPositionStable(renderToken);
  void refreshSuggestionDropdownHighlight();
};
