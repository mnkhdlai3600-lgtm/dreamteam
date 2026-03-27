export let activeElement: HTMLElement | null = null;
export let debounceTimer: number | null = null;

export let latestSuggestion: string | null = null;
export let latestSuggestions: string[] = [];
export let selectedSuggestionIndex = 0;

export let isApplyingSuggestion = false;
export let isApplyingHotkey = false;
export let messengerReplaceInProgress = false;
export let lastAppliedText: string | null = null;
export let lastCheckedText = "";
export let suppressInputUntil = 0;
export let requestCounter = 0;
export let isComposing = false;

export const setActiveElement = (element: HTMLElement | null) => {
  activeElement = element;
};

export const setDebounceTimer = (timer: number | null) => {
  debounceTimer = timer;
};

export const setLatestSuggestion = (value: string | null) => {
  latestSuggestion = value;
};

export const setLatestSuggestions = (value: string[]) => {
  latestSuggestions = value;
};

export const setSelectedSuggestionIndex = (value: number) => {
  selectedSuggestionIndex = value;
};

export const selectSuggestionByIndex = (index: number) => {
  if (!latestSuggestions.length) {
    selectedSuggestionIndex = 0;
    latestSuggestion = null;
    return;
  }

  const safeIndex = Math.max(0, Math.min(index, latestSuggestions.length - 1));
  selectedSuggestionIndex = safeIndex;
  latestSuggestion = latestSuggestions[safeIndex] ?? null;
};

export const clearSuggestion = () => {
  latestSuggestion = null;
  latestSuggestions = [];
  selectedSuggestionIndex = 0;
};

export const setIsApplyingSuggestion = (value: boolean) => {
  isApplyingSuggestion = value;
};

export const setIsApplyingHotkey = (value: boolean) => {
  isApplyingHotkey = value;
};

export const setMessengerReplaceInProgress = (value: boolean) => {
  messengerReplaceInProgress = value;
};

export const setLastAppliedText = (value: string | null) => {
  lastAppliedText = value;
};

export const setLastCheckedText = (value: string) => {
  lastCheckedText = value;
};

export const setSuppressInputUntil = (value: number) => {
  suppressInputUntil = value;
};

export const nextRequestId = () => {
  requestCounter += 1;
  return requestCounter;
};

export const setIsComposing = (value: boolean) => {
  isComposing = value;
};
