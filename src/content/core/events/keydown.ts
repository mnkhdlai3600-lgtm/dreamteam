import {
  applySuggestion,
  hasOpenSuggestions,
  selectNextSuggestion,
  selectPreviousSuggestion,
} from "../checker/checker";
import { renderSuggestionIndicator } from "../checker/render";
import { shouldSkipHotkey } from "../guard";
import {
  clearSuggestion,
  isSuggestionLoading,
  setActiveElement,
} from "../state";
import { resolveActiveEditable } from "../../dom/editable";
import { removeIndicator } from "../../ui/indicator";
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
        updateIndicatorPosition(resolved);
      }

      const canNavigateSuggestions = Boolean(
        resolved && (hasOpenSuggestions() || isSuggestionLoading),
      );

      if (canNavigateSuggestions) {
        if (event.key === "ArrowDown" && !isSuggestionLoading) {
          stopEvent(event);
          selectNextSuggestion();
          renderSuggestionIndicator();
          if (resolved) updateIndicatorPosition(resolved);
          return;
        }

        if (event.key === "ArrowUp" && !isSuggestionLoading) {
          stopEvent(event);
          selectPreviousSuggestion();
          renderSuggestionIndicator();
          if (resolved) updateIndicatorPosition(resolved);
          return;
        }

        if (event.key === "Enter" && !isSuggestionLoading) {
          stopEvent(event);
          applySuggestion();
          return;
        }

        if (event.key === "Escape") {
          stopEvent(event);
          clearSuggestion();
          removeIndicator();
          return;
        }
      }

      if (shouldSkipHotkey(event)) return;
      if (!resolved) return;

      stopEvent(event);
      applySuggestion();
    },
    true,
  );
};
