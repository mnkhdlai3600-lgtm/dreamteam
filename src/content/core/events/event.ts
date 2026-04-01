import { registerCompositionEvents } from "./composition";
import { registerFocusEvents } from "./focus";
import { registerInputEvents } from "./input";
import { registerKeydownEvents } from "./keydown";
import { registerMouseEvents } from "./mouse-events";

export const registerContentEvents = () => {
  registerCompositionEvents();
  registerFocusEvents();
  registerInputEvents();
  registerKeydownEvents();
  registerMouseEvents();
};
