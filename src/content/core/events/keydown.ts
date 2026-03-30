import {
  applySuggestion,
  hasOpenSuggestions,
  selectNextSuggestion,
  selectPreviousSuggestion,
} from "../checker/checker";
import { shouldSkipHotkey } from "../guard";
import { clearSuggestion, setActiveElement } from "../state";
import { resolveActiveEditable } from "../../dom/editable";
import { removeIndicator } from "../../ui/indicator";

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
      if (resolved) setActiveElement(resolved);

      const canNavigateSuggestions = Boolean(resolved && hasOpenSuggestions());

      if (canNavigateSuggestions) {
        if (event.key === "ArrowDown") {
          stopEvent(event);
          selectNextSuggestion();
          return;
        }

        if (event.key === "ArrowUp") {
          stopEvent(event);
          selectPreviousSuggestion();
          return;
        }

        if (event.key === "Enter") {
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
