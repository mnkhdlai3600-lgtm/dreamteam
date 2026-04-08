import type { ErrorItem } from "./types";

const findSequentialOffsets = (text: string, words: string[]) => {
  const results: Array<{ start?: number; end?: number }> = [];
  let searchFrom = 0;

  words.forEach((word) => {
    const start = text.indexOf(word, searchFrom);

    if (start >= 0) {
      const end = start + word.length;
      results.push({ start, end });
      searchFrom = end;
      return;
    }

    const fallbackStart = text.indexOf(word);

    if (fallbackStart >= 0) {
      results.push({
        start: fallbackStart,
        end: fallbackStart + word.length,
      });
      return;
    }

    results.push({});
  });

  return results;
};

export const parseErrorWords = (
  source: unknown,
  fullText = "",
): ErrorItem[] => {
  const rawErrorSource = Array.isArray(source) ? source : [];

  const normalizedWords = rawErrorSource
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (!item || typeof item !== "object") {
        return "";
      }

      const record = item as {
        word?: unknown;
        original?: unknown;
      };

      if (typeof record.word === "string") {
        return record.word.trim();
      }

      if (typeof record.original === "string") {
        return record.original.trim();
      }

      return "";
    })
    .filter((word) => !!word);

  const fallbackOffsets = findSequentialOffsets(fullText, normalizedWords);
  let fallbackIndex = 0;

  return rawErrorSource
    .map((item, index): ErrorItem | null => {
      if (typeof item === "string") {
        const word = item.trim();
        if (!word) return null;

        const offsets = fallbackOffsets[fallbackIndex++] ?? {};

        return {
          id: `err-word-${index}-${word}`,
          word,
          start: offsets.start,
          end: offsets.end,
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as {
        id?: unknown;
        word?: unknown;
        original?: unknown;
        start?: unknown;
        end?: unknown;
      };

      const word =
        typeof record.word === "string"
          ? record.word.trim()
          : typeof record.original === "string"
            ? record.original.trim()
            : "";

      if (!word) return null;

      const offsets = fallbackOffsets[fallbackIndex++] ?? {};

      const start =
        typeof record.start === "number" && Number.isFinite(record.start)
          ? record.start
          : offsets.start;

      const end =
        typeof record.end === "number" && Number.isFinite(record.end)
          ? record.end
          : typeof start === "number"
            ? start + word.length
            : offsets.end;

      const id =
        typeof record.id === "string" && record.id.trim()
          ? record.id.trim()
          : `err-pos-${index}-${start ?? "x"}-${end ?? "x"}`;

      return {
        id,
        word,
        start,
        end,
      };
    })
    .filter((item): item is ErrorItem => item !== null);
};
