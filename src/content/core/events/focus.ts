import { getEditableElement, getEventEditableTarget } from "../../dom/editable";
import { createIndicator, removeIndicator } from "../../ui/indicator-render";
import { clearSuggestion, setActiveElement } from "../state";

export const registerFocusEvents = () => {
  document.addEventListener(
    "focusin",
    (event) => {
      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);
      void createIndicator(target, "", { state: "idle" });
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
