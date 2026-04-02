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
import { handleInput } from "../checker/input";

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
};
