import {
  getEditableElement,
  getEventEditableTarget,
  isGoogleDocsSite,
  resolveActiveEditable,
} from "../../dom";
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
      const target =
        getEventEditableTarget(event) ??
        (isGoogleDocsSite() ? resolveActiveEditable() : null);

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
        if (isNavigationFocus) return;

        const editable =
          getEditableElement(document.activeElement) ??
          (isGoogleDocsSite() ? resolveActiveEditable() : null);

        if (editable) return;

        setActiveElement(null);
        clearSuggestion();
        removeIndicator();
      }, 100);
    },
    true,
  );
};
