import { createIndicator, removeIndicator } from "../ui/indicator";
import {
  getElementText,
  resolveActiveEditable,
  verifyElementText,
} from "../dom/editable";
import { setElementText } from "../dom/replace";
import { shouldSkipApplySuggestion, shouldSkipHandleInput } from "./guard";

import {
  activeElement,
  clearSuggestion,
  debounceTimer,
  lastAppliedText,
  lastCheckedText,
  latestSuggestion,
  nextRequestId,
  requestCounter,
  setActiveElement,
  setDebounceTimer,
  setIsApplyingHotkey,
  setIsApplyingSuggestion,
  setLastAppliedText,
  setLastCheckedText,
  setLatestSuggestion,
  setSuppressInputUntil,
} from "./state";

import type { CheckResponse } from "./types";

const checkWithBackground = async (text: string) =>
  new Promise<CheckResponse>((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(
        new Error(
          "Extension context old or unavailable. Tab-aa refresh hiine uu.",
        ),
      );
      return;
    }

    chrome.runtime.sendMessage(
      { type: "CHECK_TEXT", payload: { text } },
      (response: CheckResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      },
    );
  });

export const checkText = async (text: string) => {
  const trimmed = text.trim();

  if (!trimmed) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  if (lastAppliedText && trimmed === lastAppliedText.trim()) {
    clearSuggestion();
    return;
  }

  const currentRequestId = nextRequestId();

  try {
    const response = await checkWithBackground(trimmed);

    if (
      currentRequestId !== requestCounter ||
      !response?.success ||
      !response.data
    ) {
      if (currentRequestId === requestCounter)
        throw new Error(response?.error || "Check failed");
      return;
    }

    if (!activeElement) return;

    const { data } = response;
    const corrected = (data.corrected || "").trim();
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    const hasLatin = /[a-zA-Z]/.test(trimmed);
    const firstSuggestion = suggestions[0]?.trim() || "";

    const finalSuggestion =
      corrected && corrected !== trimmed
        ? corrected
        : firstSuggestion && firstSuggestion !== trimmed
          ? firstSuggestion
          : "";

    const shouldSuggest =
      !!finalSuggestion && (data.changed || hasLatin || suggestions.length > 0);

    if (!shouldSuggest) {
      clearSuggestion();
      removeIndicator();
      return;
    }

    setLatestSuggestion(finalSuggestion);

    const prefix =
      data.mode === "openai-galig" || hasLatin
        ? "Option+Space дарж кирилл болгоно: "
        : "Option+Space дарж засна: ";

    void createIndicator(activeElement, `${prefix}${finalSuggestion}`);
  } catch (error) {
    if (currentRequestId !== requestCounter) return;
    clearSuggestion();
    if (activeElement) {
      void createIndicator(
        activeElement,
        error instanceof Error ? error.message : "Холболтын алдаа",
      );
    }
  }
};

export const handleInput = () => {
  if (shouldSkipHandleInput() || !activeElement) return;

  const text = getElementText(activeElement).trim();

  if (!text) {
    clearSuggestion();
    removeIndicator();
    return;
  }

  if (
    (lastAppliedText && text === lastAppliedText.trim()) ||
    text === lastCheckedText
  )
    return;
  if (debounceTimer) window.clearTimeout(debounceTimer);

  setDebounceTimer(
    window.setTimeout(() => {
      if (shouldSkipHandleInput() || !activeElement) return;

      const latestText = getElementText(activeElement).trim();

      if (!latestText) {
        clearSuggestion();
        removeIndicator();
        return;
      }

      if (
        (lastAppliedText && latestText === lastAppliedText.trim()) ||
        latestText === lastCheckedText
      )
        return;

      setLastCheckedText(latestText);
      void checkText(latestText);
    }, 700),
  );
};

export const applySuggestion = () => {
  const resolved = resolveActiveEditable();
  if (shouldSkipApplySuggestion() || !resolved || !latestSuggestion) return;

  setActiveElement(resolved);

  const currentText = getElementText(resolved).trim();
  if (!currentText) return;

  setIsApplyingHotkey(true);

  const suggestion = latestSuggestion;
  setLatestSuggestion(null);
  setSuppressInputUntil(Date.now() + 3000);
  setIsApplyingSuggestion(true);

  try {
    const ok = setElementText(resolved, suggestion);

    if (!ok) {
      void createIndicator(resolved, "Replace амжилтгүй");
      return;
    }

    setLastAppliedText(suggestion);
    setLastCheckedText(suggestion.trim());

    window.setTimeout(() => {
      void createIndicator(
        resolved,
        verifyElementText(resolved, suggestion)
          ? "Засвар хэрэглэгдлээ"
          : "Replace амжилтгүй",
      );
    }, 120);
  } finally {
    window.setTimeout(() => setIsApplyingSuggestion(false), 700);
    window.setTimeout(() => setIsApplyingHotkey(false), 400);
  }
};
