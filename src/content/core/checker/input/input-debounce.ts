import { debounceTimer, setDebounceTimer } from "../../state";

export const clearPendingDebounce = () => {
  if (!debounceTimer) return;
  window.clearTimeout(debounceTimer);
  setDebounceTimer(null);
};
