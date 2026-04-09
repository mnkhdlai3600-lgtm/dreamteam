import {
  getEditableElement,
  getEventEditableTarget,
  resolveActiveEditable,
} from "../../dom";
import {
  getGoogleDocsEventTarget,
  isGoogleDocsSite,
  resolveGoogleDocsActiveEditable,
} from "../../dom/google-docs";
import { updateIndicatorPosition } from "../../ui";
import {
  createIndicator,
  removeIndicator,
} from "../../ui/indicator/indicator-render";
import { renderSuggestionIndicator } from "../checker/render";
import {
  hidePersistedSuggestion,
  restorePersistedSuggestionForElement,
} from "../checker/persist";
import {
  getLastEditableElement,
  indicatorErrorCount,
  indicatorVisualState,
  setActiveElement,
  suppressInputUntil,
} from "../state";

const isBolorUiElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    "[data-bolor-dropdown], #bolor-ai-suggestion-dropdown, #bolor-ai-indicator",
  );
};

const isDocsTitleElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    [
      '[aria-label="Document name"]',
      '[aria-label="Документын нэр"]',
      '[aria-label="Rename document"]',
      ".docs-title-input",
      "#docs-title-input",
      ".docs-title-widget",
    ].join(","),
  );
};

const resolveDocsEditable = () => {
  return getGoogleDocsEventTarget() ?? resolveGoogleDocsActiveEditable();
};

const restoreLastEditableFocus = () => {
  const lastEditable = getLastEditableElement();
  if (!lastEditable) return;

  window.setTimeout(() => {
    try {
      lastEditable.focus();
    } catch {}
  }, 0);
};

export const registerFocusEvents = () => {
  document.addEventListener(
    "focusin",
    (event) => {
      if (isBolorUiElement(event.target)) {
        restoreLastEditableFocus();
        return;
      }

      if (isGoogleDocsSite() && isDocsTitleElement(event.target)) {
        const docsEditable = resolveDocsEditable() ?? getLastEditableElement();
        if (!docsEditable) return;

        setActiveElement(docsEditable);
        restoreLastEditableFocus();
        return;
      }

      const target =
        getEventEditableTarget(event) ??
        (isGoogleDocsSite() ? resolveDocsEditable() : null) ??
        resolveActiveEditable();

      if (!target) return;

      setActiveElement(target);

      hidePersistedSuggestion();
      renderSuggestionIndicator();

      const restored = restorePersistedSuggestionForElement(target);

      if (restored) {
        void createIndicator(target, "", { state: "latin" });
        renderSuggestionIndicator();
        updateIndicatorPosition(target);
        return;
      }

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
    (event) => {
      if (isBolorUiElement(event.target)) {
        restoreLastEditableFocus();
        return;
      }

      window.setTimeout(() => {
        const isNavigationFocus = Date.now() < suppressInputUntil;
        if (isNavigationFocus) return;

        hidePersistedSuggestion();
        renderSuggestionIndicator();

        if (isGoogleDocsSite()) {
          const docsEditable = resolveDocsEditable();
          if (docsEditable) {
            setActiveElement(docsEditable);
            return;
          }

          if (isDocsTitleElement(document.activeElement)) {
            restoreLastEditableFocus();
            return;
          }

          const lastEditable = getLastEditableElement();
          if (lastEditable) {
            setActiveElement(lastEditable);
            restoreLastEditableFocus();
            return;
          }
        }

        const editable =
          getEditableElement(document.activeElement) ??
          (isGoogleDocsSite() ? resolveActiveEditable() : null);

        if (editable) return;

        setActiveElement(null);
        removeIndicator();
      }, 100);
    },
    true,
  );
};
