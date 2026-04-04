import { removeIndicator, updateIndicatorPosition } from "../../ui";
import { sendCheckTextMessage } from "../../../lib/chrome";
import {
  activeElement,
  clearSuggestion,
  lastAppliedText,
  resetIndicatorVisualState,
  setActiveElement,
  setIndicatorErrorCount,
  setIndicatorVisualState,
  setLatestSuggestion,
  setLatestSuggestions,
  setSelectedErrorRange,
  setSelectedSuggestionIndex,
  setShouldAutoAdvanceError,
  setSuggestionPhase,
  setIsSuggestionLoading,
  shouldAutoAdvanceError,
} from "../state";
import { renderSuggestionIndicator } from "./render";
import {
  clearHighlights,
  getElementText,
  highlightErrorWords,
  resolveActiveEditable,
} from "../../dom";
import { clearHighlightedErrors, setHighlightedErrors } from "../error-state";
import type { HighlightErrorItem } from "../error-state";
import { parseErrorWords } from "./request-errors";
import { requestSuggestionsForWord } from "./request-word";
import { buildDisplaySuggestions, uniqueSuggestions } from "./request-utils";

export const checkText = async (text: string) => {
  const trimmed = text.trim();
  const justApplied = !!lastAppliedText && trimmed === lastAppliedText.trim();

  if (!trimmed) {
    clearSuggestion();
    clearHighlightedErrors();
    setShouldAutoAdvanceError(false);
    resetIndicatorVisualState();
    removeIndicator();
    return;
  }

  if (justApplied) {
    clearSuggestion();

    if (activeElement) {
      clearHighlights(activeElement);
    }
  }

  try {
    const response = await sendCheckTextMessage(trimmed);

    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Шалгалт амжилтгүй");
    }

    const currentEditable = resolveActiveEditable() ?? activeElement;
    if (!currentEditable) return;

    setActiveElement(currentEditable);

    const currentElementText = getElementText(currentEditable).trim();
    if (!currentElementText || currentElementText !== trimmed) {
      return;
    }

    const { data } = response;

    const corrected =
      typeof data.corrected === "string" ? data.corrected.trim() : "";

    const suggestions = uniqueSuggestions(
      Array.isArray(data.suggestions)
        ? data.suggestions.filter(
            (item: unknown): item is string => typeof item === "string",
          )
        : [],
    );

    const rawErrorWords = parseErrorWords(data.errorWords);

    const hasLatin = /[A-Za-z]/.test(trimmed);
    const hasCyrillic = /[А-Яа-яӨөҮүЁё]/.test(trimmed);
    const isLatinInput = hasLatin && !hasCyrillic;

    const errorWords = isLatinInput ? [] : rawErrorWords;

    const displaySuggestions = buildDisplaySuggestions(
      trimmed,
      corrected,
      suggestions,
      isLatinInput,
    );

    const hasSentenceCorrection = corrected.length > 0 && corrected !== trimmed;
    const hasSuggestions = displaySuggestions.length > 0;
    const hasErrors = errorWords.length > 0;
    const isAutoAdvancing = shouldAutoAdvanceError;

    clearHighlights(currentEditable);
    clearHighlightedErrors();

    let autoAdvanceHandled = false;

    if (isLatinInput) {
      setIndicatorVisualState("latin");
      setIndicatorErrorCount(0);
      setShouldAutoAdvanceError(false);
    } else if (hasErrors) {
      const inlineHighlighted = highlightErrorWords(
        currentEditable,
        errorWords.map((item) => item.word),
      );

      const items: HighlightErrorItem[] = inlineHighlighted.length
        ? inlineHighlighted.map((item, index) => ({
            ...item,
            start: errorWords[index]?.start,
            end: errorWords[index]?.end,
          }))
        : errorWords.map((item) => ({
            id: item.id,
            word: item.word,
            start: item.start,
            end: item.end,
          }));

      setHighlightedErrors(items);
      setIndicatorVisualState("error");
      setIndicatorErrorCount(items.length || errorWords.length);

      if (isAutoAdvancing && items.length > 0) {
        const liveEditable = resolveActiveEditable() ?? currentEditable;

        if (
          liveEditable instanceof HTMLInputElement ||
          liveEditable instanceof HTMLTextAreaElement
        ) {
          const target = items[0];

          if (
            target &&
            typeof target.start === "number" &&
            typeof target.end === "number"
          ) {
            const start = target.start;
            const end = target.end;

            setActiveElement(liveEditable);
            setIndicatorVisualState("error");
            setIndicatorErrorCount(items.length || errorWords.length);
            setIsSuggestionLoading(true);

            try {
              const result = await requestSuggestionsForWord(target.word);

              if (result.suggestions.length > 0) {
                setLatestSuggestions(result.suggestions);
                setSelectedSuggestionIndex(0);
                setLatestSuggestion(result.suggestions[0] ?? null);
                setSuggestionPhase("suggesting");
              } else if (result.corrected && result.corrected !== target.word) {
                setLatestSuggestions([result.corrected]);
                setSelectedSuggestionIndex(0);
                setLatestSuggestion(result.corrected);
                setSuggestionPhase("suggesting");
              } else {
                clearSuggestion();
                setSuggestionPhase("idle");
              }

              requestAnimationFrame(() => {
                const latestEditable = resolveActiveEditable() ?? liveEditable;

                if (
                  latestEditable instanceof HTMLInputElement ||
                  latestEditable instanceof HTMLTextAreaElement
                ) {
                  setActiveElement(latestEditable);
                  latestEditable.focus();
                  latestEditable.setSelectionRange(start, end);

                  setSelectedErrorRange({ start, end });

                  renderSuggestionIndicator();
                  updateIndicatorPosition(latestEditable);
                }
              });
            } catch {
              clearSuggestion();
              setSuggestionPhase("idle");
            } finally {
              setIsSuggestionLoading(false);
              setShouldAutoAdvanceError(false);
              autoAdvanceHandled = true;
            }
          } else {
            setShouldAutoAdvanceError(false);
          }
        } else {
          setShouldAutoAdvanceError(false);
        }
      } else {
        setShouldAutoAdvanceError(false);
      }
    } else if (hasSentenceCorrection || hasSuggestions) {
      setIndicatorVisualState(isLatinInput ? "latin" : "success");
      setIndicatorErrorCount(0);
      setShouldAutoAdvanceError(false);
    } else if (justApplied && !isLatinInput && !hasErrors) {
      setIndicatorVisualState("success");
      setIndicatorErrorCount(0);
      setShouldAutoAdvanceError(false);

      window.setTimeout(() => {
        const latestEditable = resolveActiveEditable() ?? activeElement;
        if (!latestEditable) return;

        const latestText = getElementText(latestEditable).trim();
        if (latestText !== trimmed) return;

        setIndicatorVisualState("idle");
        setIndicatorErrorCount(0);
        renderSuggestionIndicator();
        updateIndicatorPosition(latestEditable);
      }, 1000);
    } else {
      setIndicatorVisualState("idle");
      setIndicatorErrorCount(0);
      setShouldAutoAdvanceError(false);
    }

    const shouldAutoOpenSentenceSuggestions =
      !justApplied &&
      !isAutoAdvancing &&
      errorWords.length <= 1 &&
      (hasSuggestions || hasSentenceCorrection);

    if (!autoAdvanceHandled) {
      if (isLatinInput && hasSuggestions) {
        setLatestSuggestions(displaySuggestions);
        setSelectedSuggestionIndex(0);
        setLatestSuggestion(displaySuggestions[0] ?? null);
        setSuggestionPhase("suggesting");
      } else if (isLatinInput && hasSentenceCorrection) {
        setLatestSuggestions([corrected]);
        setSelectedSuggestionIndex(0);
        setLatestSuggestion(corrected);
        setSuggestionPhase("suggesting");
      } else if (
        !isLatinInput &&
        shouldAutoOpenSentenceSuggestions &&
        hasSuggestions
      ) {
        setLatestSuggestions(displaySuggestions);
        setSelectedSuggestionIndex(0);
        setLatestSuggestion(displaySuggestions[0] ?? null);
        setSuggestionPhase("suggesting");
      } else if (
        !isLatinInput &&
        shouldAutoOpenSentenceSuggestions &&
        hasSentenceCorrection
      ) {
        setLatestSuggestions([corrected]);
        setSelectedSuggestionIndex(0);
        setLatestSuggestion(corrected);
        setSuggestionPhase("suggesting");
      } else if (!isAutoAdvancing) {
        clearSuggestion();
        setSuggestionPhase("idle");
      }

      renderSuggestionIndicator();
      updateIndicatorPosition(currentEditable);
    }
  } catch {
    clearSuggestion();
    clearHighlightedErrors();
    resetIndicatorVisualState();
    setShouldAutoAdvanceError(false);

    const currentEditable = resolveActiveEditable() ?? activeElement;

    if (currentEditable) {
      clearHighlights(currentEditable);
      renderSuggestionIndicator();
      updateIndicatorPosition(currentEditable);
    } else {
      removeIndicator();
    }
  }
};
