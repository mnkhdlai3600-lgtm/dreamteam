import { selectedSuggestionIndex } from "../../core/state";
import { getDropdownElement } from "./dropdown-dom";
import {
  getResolvedTheme,
  getSurfaceStylesByTheme,
} from "../indicator/indicator-theme";

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
