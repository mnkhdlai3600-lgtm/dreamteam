import { getEventEditableTarget, isMessengerSite } from "../../dom";
import { updateIndicatorPosition } from "../../ui";
import { shouldSkipHandleInput } from "../guard";
import { activeElement, setActiveElement } from "../state";
import { handleInput } from "./input-handlers";
import { ignoredKey } from "./input-helpers";

export const registerInputEvents = () => {
  document.addEventListener(
    "input",
    (event) => {
      if (shouldSkipHandleInput()) return;

      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);
      updateIndicatorPosition(target);
      handleInput();
    },
    true,
  );

  document.addEventListener(
    "keyup",
    (event) => {
      if (isMessengerSite() || shouldSkipHandleInput()) return;

      const keyboardEvent = event as KeyboardEvent;
      if (ignoredKey(keyboardEvent)) return;

      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);
      updateIndicatorPosition(target);
      handleInput();
    },
    true,
  );

  document.addEventListener(
    "selectionchange",
    () => {
      if (!activeElement) return;
      updateIndicatorPosition(activeElement);
    },
    true,
  );
};
