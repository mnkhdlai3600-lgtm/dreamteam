import { getEditableElement, getEventEditableTarget } from "../../dom/editable";
import {
  createIndicator,
  removeIndicator,
} from "../../ui/indicator/indicator-render";

import {
  clearSuggestion,
  indicatorErrorCount,
  indicatorVisualState,
  setActiveElement,
  suppressInputUntil,
} from "../state";

export const registerFocusEvents = () => {
  document.addEventListener(
    "focusin",
    (event) => {
      const target = getEventEditableTarget(event);
      if (!target) return;

      setActiveElement(target);

      const isNavigationFocus = Date.now() < suppressInputUntil;

      if (isNavigationFocus) {
        void createIndicator(target, "", {
          state:
            indicatorVisualState === "idle" ? "error" : indicatorVisualState,
          errorCount: indicatorErrorCount,
        });
        return;
      }

      void createIndicator(target, "", { state: "idle" });
    },
    true,
  );

  document.addEventListener(
    "focusout",
    () => {
      window.setTimeout(() => {
        const isNavigationFocus = Date.now() < suppressInputUntil;
        if (isNavigationFocus) {
          return;
        }

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
