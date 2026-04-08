export const ignoredKey = (event: KeyboardEvent) => {
  if (event.altKey && event.code === "Space") return true;

  return (
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.key === "Enter" ||
    event.key === "Escape"
  );
};
