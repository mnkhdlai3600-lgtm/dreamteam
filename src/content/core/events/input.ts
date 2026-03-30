import { handleInput } from "../checker/checker";
import { shouldSkipHandleInput } from "../guard";
import { isMessengerSite, getEventEditableTarget } from "../../dom/editable";
import { setActiveElement } from "../state";
import { PASTE_DELAY_MS } from "../../../lib/constants";

const ignoredKey = (event: KeyboardEvent) => {
  if (event.altKey && event.code === "Space") return true;

  return (
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.key === "Enter" ||
    event.key === "Escape"
  );
};

export const registerInputEvents = () => {
  document.addEventListener(
    "input",
    (event) => {
      if (shouldSkipHandleInput()) return;

      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);
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
      handleInput();
    },
    true,
  );

  document.addEventListener(
    "paste",
    (event) => {
      if (shouldSkipHandleInput()) return;

      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);
      window.setTimeout(() => handleInput(), PASTE_DELAY_MS);
    },
    true,
  );
};
