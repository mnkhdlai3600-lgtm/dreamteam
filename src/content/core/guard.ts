import {
  isApplyingHotkey,
  isApplyingSuggestion,
  isComposing,
  latestSuggestion,
  messengerReplaceInProgress,
  suppressInputUntil,
} from "./state";

export const shouldSkipHandleInput = () => {
  if (isApplyingSuggestion) return true;
  if (messengerReplaceInProgress) return true;
  if (isComposing) return true;
  if (Date.now() < suppressInputUntil) return true;
  return false;
};

export const shouldSkipApplySuggestion = () => {
  if (isApplyingHotkey) return true;
  if (messengerReplaceInProgress) return true;
  if (isComposing) return true;
  return false;
};

export const shouldSkipHotkey = (event: Event) => {
  const keyboardEvent = event as KeyboardEvent;

  if (!(keyboardEvent.altKey && keyboardEvent.code === "Space")) return true;
  if (keyboardEvent.repeat) return true;
  if (isApplyingHotkey) return true;
  if (messengerReplaceInProgress) return true;
  if (isComposing) return true;
  if (!latestSuggestion) return true;

  return false;
};
