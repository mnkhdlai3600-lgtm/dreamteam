import { activeElement, suggestionPhase } from "../state";
import { getHoveredErrorId, setHoveredErrorId } from "../error-state";
import { removeIndicator, updateIndicatorPosition } from "../../ui";

const getErrorTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null;

  return target.closest(
    ".bolor-error[data-bolor-error-id]",
  ) as HTMLElement | null;
};

export const registerMouseEvents = () => {
  document.addEventListener(
    "mouseover",
    (event) => {
      const errorEl = getErrorTarget(event.target);
      if (!errorEl) return;

      const errorId = errorEl.dataset.bolorErrorId ?? null;
      if (!errorId) return;
      if (getHoveredErrorId() === errorId) return;

      setHoveredErrorId(errorId);

      if (!activeElement) return;

      if (suggestionPhase === "suggesting" || suggestionPhase === "loading") {
        updateIndicatorPosition(activeElement);
      }
    },
    true,
  );

  document.addEventListener(
    "mouseout",
    (event) => {
      const fromError = getErrorTarget(event.target);
      if (!fromError) return;

      const related = event.relatedTarget;
      const toError = getErrorTarget(related);

      if (
        toError &&
        toError.dataset.bolorErrorId === fromError.dataset.bolorErrorId
      ) {
        return;
      }

      setHoveredErrorId(null);

      if (activeElement) {
        updateIndicatorPosition(activeElement);
      } else {
        removeIndicator();
      }
    },
    true,
  );

  document.addEventListener(
    "scroll",
    () => {
      if (!activeElement) return;
      updateIndicatorPosition(activeElement);
    },
    true,
  );
};
