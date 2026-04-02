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
  setSelectedSuggestionIndex,
  setShouldAutoAdvanceError,
  shouldAutoAdvanceError,
  setSelectedErrorRange,
  setSuggestionPhase,
  setIsSuggestionLoading,
} from "../state";
import { renderSuggestionIndicator } from "./render";
import {
  clearHighlights,
  highlightErrorWords,
  getElementText,
  resolveActiveEditable,
} from "../../dom";
import { clearHighlightedErrors, setHighlightedErrors } from "../error-state";
import type { HighlightErrorItem } from "../error-state";

const uniqueSuggestions = (items: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const value = item.trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
  }

  return result;
};

type ErrorItem = {
  id: string;
  word: string;
  start: number;
  end: number;
};

const buildDisplaySuggestions = (
  original: string,
  corrected: string,
  suggestions: string[],
  isLatinInput: boolean,
) => {
  const trimmedOriginal = original.trim();
  const trimmedCorrected = corrected.trim();

  if (isLatinInput) {
    if (trimmedCorrected && trimmedCorrected !== trimmedOriginal) {
      return [trimmedCorrected];
    }

    return [];
  }

  const result: string[] = [];

  if (trimmedCorrected && trimmedCorrected !== trimmedOriginal) {
    result.push(trimmedCorrected);
  }

  for (const suggestion of suggestions) {
    const value = suggestion.trim();
    if (!value) continue;
    if (value === trimmedOriginal) continue;
    result.push(value);
  }

  return uniqueSuggestions(result);
};

type SingleWordSuggestResult = {
  suggestions: string[];
  corrected: string | null;
};

export const requestSuggestionsForWord = async (
  word: string,
): Promise<SingleWordSuggestResult> => {
  const trimmed = word.trim();

  if (!trimmed) {
    return {
      suggestions: [],
      corrected: null,
    };
  }

  const response = await sendCheckTextMessage(trimmed);

  if (!response?.success || !response.data) {
    throw new Error(response?.error || "Үгийн санал авахад алдаа гарлаа");
  }

  const corrected =
    typeof response.data.corrected === "string"
      ? response.data.corrected.trim()
      : "";

  const suggestions = uniqueSuggestions(
    Array.isArray(response.data.suggestions)
      ? response.data.suggestions.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [],
  );

  const displaySuggestions = buildDisplaySuggestions(
    trimmed,
    corrected,
    suggestions,
    false,
  );

  return {
    suggestions: displaySuggestions,
    corrected: corrected || null,
  };
};

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

    const rawErrorSource: unknown[] = Array.isArray(data.errorWords)
      ? (data.errorWords as unknown[])
      : [];

    const rawErrorWords: ErrorItem[] = rawErrorSource
      .filter(
        (
          item,
        ): item is {
          id?: unknown;
          word?: unknown;
          start?: unknown;
          end?: unknown;
        } => !!item && typeof item === "object",
      )
      .map((item, index) => {
        const word = typeof item.word === "string" ? item.word.trim() : "";

        const start =
          typeof item.start === "number" && Number.isFinite(item.start)
            ? item.start
            : 0;

        const end =
          typeof item.end === "number" && Number.isFinite(item.end)
            ? item.end
            : start + word.length;

        const id =
          typeof item.id === "string" && item.id.trim()
            ? item.id.trim()
            : `err-pos-${index}-${start}-${end}`;

        return {
          id,
          word,
          start,
          end,
        };
      })
      .filter((item) => item.word.length > 0);

    const hasLatin = /[A-Za-z]/.test(trimmed);
    const hasCyrillic = /[А-Яа-яӨөҮүЁё]/.test(trimmed);
    const isLatinInput = hasLatin && !hasCyrillic;

    const errorWords: ErrorItem[] = isLatinInput ? [] : rawErrorWords;

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

    console.log("РЭКҮЭСТ ЭХЭЛЛЭЭ", {
      trimmed,
      isAutoAdvancing,
      lastAppliedText,
    });

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
          console.log("АВТО НЕКСТ АЖИЛЛАЖ БАЙНА", {
            items,
            activeElementTag:
              liveEditable instanceof HTMLElement ? liveEditable.tagName : null,
          });

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

                  setSelectedErrorRange({
                    start,
                    end,
                  });

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
  } catch (error) {
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
