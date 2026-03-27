import { applySuggestion, handleInput } from "./checker";
import { clearSuggestion, setActiveElement, setIsComposing } from "./state";
import {
  getEditableElement,
  getEventEditableTarget,
  isMessengerSite,
  resolveActiveEditable,
} from "../dom/editable";
import { removeIndicator, createIndicator } from "../ui/indicator";
import { shouldSkipHandleInput, shouldSkipHotkey } from "./guard";

export const registerContentEvents = () => {
  document.addEventListener(
    "compositionstart",
    () => setIsComposing(true),
    true,
  );

  document.addEventListener(
    "compositionend",
    () => setIsComposing(false),
    true,
  );

  document.addEventListener(
    "focusin",
    (event) => {
      const target = getEventEditableTarget(event);
      if (!target) return;
      setActiveElement(target);
      void createIndicator(target);
    },
    true,
  );

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
      if (keyboardEvent.altKey && keyboardEvent.code === "Space") return;

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
      window.setTimeout(() => handleInput(), 50);
    },
    true,
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (shouldSkipHotkey(event)) return;

      const resolved = resolveActiveEditable();
      if (!resolved) return;

      setActiveElement(resolved);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      applySuggestion();
    },
    true,
  );

  document.addEventListener(
    "focusout",
    () => {
      window.setTimeout(() => {
        const editable = getEditableElement(document.activeElement);
        if (editable) return;

        setActiveElement(null);
        clearSuggestion();
        removeIndicator();
      }, 100);
    },
    true,
  );
};
