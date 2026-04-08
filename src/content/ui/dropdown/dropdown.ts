import {
  isSuggestionLoading,
  latestSuggestions,
  setIsSuggestionMenuOpen,
} from "../../core/state";
import {
  createDropdownElement,
  ensureDropdownStyles,
  getAllDropdownElements,
} from "./dropdown-dom";
import {
  hasDropdownAnchor,
  repositionSuggestionDropdown,
} from "./dropdown-position";
import { refreshSuggestionDropdownHighlight } from "./dropdown-highlight";
import {
  createFooter,
  createLoadingRow,
  createSuggestionItem,
} from "./dropdown-items";
import {
  isActiveDropdownRenderToken,
  nextDropdownRenderToken,
} from "./dropdown-state";

console.log("DROPDOWN FILE LOADED 777");

export const removeSuggestionDropdown = () => {
  console.log("[болор][dropdown] removeSuggestionDropdown");
  getAllDropdownElements().forEach((element) => element.remove());
  setIsSuggestionMenuOpen(false);
};

const refreshDropdownPositionStable = (renderToken: number) => {
  if (!isActiveDropdownRenderToken(renderToken)) return;

  repositionSuggestionDropdown();

  requestAnimationFrame(() => {
    if (!isActiveDropdownRenderToken(renderToken)) return;
    repositionSuggestionDropdown();

    window.setTimeout(() => {
      if (!isActiveDropdownRenderToken(renderToken)) return;
      repositionSuggestionDropdown();
    }, 30);
  });
};

export const renderSuggestionDropdown = async (
  onPick: (value: string) => void,
) => {
  const renderToken = nextDropdownRenderToken();

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

  if (!isActiveDropdownRenderToken(renderToken)) return;
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

      if (!isActiveDropdownRenderToken(renderToken)) return;
    }

    dropdown.appendChild(await createFooter());
  }

  if (!isActiveDropdownRenderToken(renderToken)) return;

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
