import type { ErrorItem } from "./request-types";

export const parseErrorWords = (source: unknown): ErrorItem[] => {
  const rawErrorSource: unknown[] = Array.isArray(source)
    ? (source as unknown[])
    : [];

  return rawErrorSource
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
};
