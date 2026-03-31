import { getEventEditableTarget } from "../../dom";
import { updateIndicatorPosition } from "../../ui";
import { renderSuggestionIndicator } from "../checker/render";
import { shouldSkipHandleInput } from "../guard";
import {
  hasSuggestions,
  isSuggestionLoading,
  setActiveElement,
  setSuggestionPhase,
  clearSuggestion,
} from "../state";
import { handleInput } from "./input-handlers";

export const registerInputEvents = () => {
  document.addEventListener(
    "input",
    (event) => {
      if (shouldSkipHandleInput()) return;

      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);

      const hadSuggestionUi = hasSuggestions() || isSuggestionLoading;

      if (hadSuggestionUi) {
        clearSuggestion();
        setSuggestionPhase("typing");
        void renderSuggestionIndicator();
      } else {
        setSuggestionPhase("typing");
        updateIndicatorPosition(target);
      }

      handleInput();
    },
    true,
  );

  // intentionally disabled
  // keyup makes the typing dot restart every key
  // and interferes with debounce -> suggest flow

  // intentionally disabled
  // selectionchange makes the indicator jump around
};
