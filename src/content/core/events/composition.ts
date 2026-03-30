import { setIsComposing } from "../state";

export const registerCompositionEvents = () => {
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
};
