import { registerCompositionEvents } from "./composition";
import { registerFocusEvents } from "./focus";
import { registerInputEvents } from "./input";
import { registerKeydownEvents } from "./keydown";

export const registerContentEvents = () => {
  registerCompositionEvents();
  registerFocusEvents();
  registerInputEvents();
  registerKeydownEvents();
};
