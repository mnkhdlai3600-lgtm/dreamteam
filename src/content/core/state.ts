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
export let isSuggestionMenuOpen = false;
export let isSuggestionLoading = false;

export type SuggestionPhase = "idle" | "typing" | "loading" | "suggesting";
export let suggestionPhase: SuggestionPhase = "idle";

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

  if (!value.length) {
    latestSuggestion = null;
    selectedSuggestionIndex = 0;
    return;
  }

  if (selectedSuggestionIndex >= value.length) {
    selectedSuggestionIndex = 0;
  }

  latestSuggestion = value[selectedSuggestionIndex] ?? value[0] ?? null;
};

export const setSelectedSuggestionIndex = (value: number) => {
  selectedSuggestionIndex = value;
  latestSuggestion = latestSuggestions[value] ?? null;
};

export const selectSuggestionByIndex = (index: number) => {
  if (!latestSuggestions.length) {
    selectedSuggestionIndex = 0;
    latestSuggestion = null;
    return;
  }

  const safeIndex =
    ((index % latestSuggestions.length) + latestSuggestions.length) %
    latestSuggestions.length;

  selectedSuggestionIndex = safeIndex;
  latestSuggestion = latestSuggestions[safeIndex] ?? null;
};

export const clearSuggestion = () => {
  latestSuggestion = null;
  latestSuggestions = [];
  selectedSuggestionIndex = 0;
  isSuggestionMenuOpen = false;
  isSuggestionLoading = false;
  suggestionPhase = "idle";
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

export const isLatestRequest = (requestId: number) => {
  return requestId === requestCounter;
};

export const cancelPendingRequests = () => {
  requestCounter += 1;
};

export const setIsComposing = (value: boolean) => {
  isComposing = value;
};

export const setIsSuggestionMenuOpen = (value: boolean) => {
  isSuggestionMenuOpen = value;
};

export const setIsSuggestionLoading = (value: boolean) => {
  isSuggestionLoading = value;
};

export const setSuggestionPhase = (value: SuggestionPhase) => {
  suggestionPhase = value;
};

export const hasSuggestions = () => latestSuggestions.length > 0;

export type IndicatorVisualState =
  | "idle"
  | "loading"
  | "latin"
  | "error"
  | "success";

export let indicatorVisualState: IndicatorVisualState = "idle";
export let indicatorErrorCount = 0;

export const setIndicatorVisualState = (value: IndicatorVisualState) => {
  indicatorVisualState = value;
};

export const setIndicatorErrorCount = (value: number) => {
  indicatorErrorCount = value;
};

export const resetIndicatorVisualState = () => {
  indicatorVisualState = "idle";
  indicatorErrorCount = 0;
};

export let currentErrorNavigationIndex = 0;

export const setCurrentErrorNavigationIndex = (value: number) => {
  currentErrorNavigationIndex = value;
};

export const resetErrorNavigationIndex = () => {
  currentErrorNavigationIndex = 0;
};

export const getNextErrorNavigationIndex = (total: number) => {
  if (total <= 0) return 0;

  const next = currentErrorNavigationIndex % total;
  currentErrorNavigationIndex = (currentErrorNavigationIndex + 1) % total;

  return next;
};

export let selectedErrorRange: { start: number; end: number } | null = null;
export let focusedErrorId: string | null = null;
export let shouldAutoAdvanceError = false;

export const setSelectedErrorRange = (
  range: { start: number; end: number } | null,
) => {
  selectedErrorRange = range;
};

export const clearSelectedErrorRange = () => {
  selectedErrorRange = null;
};

export const setFocusedErrorId = (value: string | null) => {
  focusedErrorId = value;
};

export const clearFocusedErrorId = () => {
  focusedErrorId = null;
};

export const setShouldAutoAdvanceError = (value: boolean) => {
  shouldAutoAdvanceError = value;
};
