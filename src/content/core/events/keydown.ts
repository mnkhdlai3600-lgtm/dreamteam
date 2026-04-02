import { applySuggestion } from "../checker/apply";
import {
  hasOpenSuggestions,
  selectNextSuggestion,
  selectPreviousSuggestion,
} from "../checker/checker";
import {
  clearSuggestion,
  isSuggestionLoading,
  latestSuggestion,
  setActiveElement,
} from "../state";
import { resolveActiveEditable } from "../../dom/editable";
import { removeSuggestionDropdown } from "../../ui";
import { updateIndicatorPosition } from "../../ui/indicator/indicator-render";

const stopEvent = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
};

export const registerKeydownEvents = () => {
  document.addEventListener(
    "keydown",
    (event) => {
      const resolved = resolveActiveEditable();
      if (resolved) {
        setActiveElement(resolved);
      }

      const canNavigateSuggestions = Boolean(
        resolved &&
        (hasOpenSuggestions() || isSuggestionLoading || latestSuggestion),
      );

      if (!canNavigateSuggestions) return;

      if (event.key === "ArrowDown" && !isSuggestionLoading) {
        stopEvent(event);
        selectNextSuggestion();
        if (resolved) updateIndicatorPosition(resolved);
        return;
      }

      if (event.key === "ArrowUp" && !isSuggestionLoading) {
        stopEvent(event);
        selectPreviousSuggestion();
        if (resolved) updateIndicatorPosition(resolved);
        return;
      }

      if (event.key === "Enter" && !isSuggestionLoading && latestSuggestion) {
        stopEvent(event);
        applySuggestion();
        return;
      }

      if (event.key === "Escape") {
        stopEvent(event);
        clearSuggestion();
        removeSuggestionDropdown();
        if (resolved) updateIndicatorPosition(resolved);
      }
    },
    true,
  );
};
