import { getDotStylesByTheme, getResolvedTheme } from "./indicator-theme";

export type IndicatorState = "idle" | "loading" | "latin" | "error" | "success";

let dotRenderToken = 0;

export const buildDotIndicator = async (
  container: HTMLDivElement,
  state: IndicatorState,
  errorCount = 0,
) => {
  const renderToken = ++dotRenderToken;

  container.dataset.mode = "dot";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.width = "22px";
  container.style.height = "22px";
  container.style.pointerEvents = "none";
  container.style.background = "transparent";
  container.style.border = "none";
  container.style.boxShadow = "none";
  container.style.borderRadius = "999px";
  container.style.overflow = "visible";
  container.style.minWidth = "0";
  container.style.maxWidth = "none";
  container.style.backdropFilter = "none";
  container.style.opacity = "1";
  container.style.transform = "none";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  const dotNode = await createBreathingDot(state, errorCount);

  if (renderToken !== dotRenderToken) return;
  if (!container.isConnected) return;
  if (container.dataset.mode !== "dot") return;

  container.replaceChildren(dotNode);
};

const getIdleColorByTheme = (theme: "light" | "dark") => {
  return theme === "dark" ? "#d1d5db" : "#4b5563";
};

const getDotColor = (
  state: IndicatorState,
  resolvedTheme: "light" | "dark",
) => {
  if (state === "latin") return "#facc15";
  if (state === "error") return "#ef4444";
  if (state === "success") return "#22c55e";
  return getIdleColorByTheme(resolvedTheme);
};

const createBreathingDot = async (
  state: IndicatorState,
  errorCount: number,
) => {
  const wrapper = document.createElement("div");
  wrapper.style.width = "22px";
  wrapper.style.height = "22px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.pointerEvents = "none";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.flexShrink = "0";

  const resolvedTheme = await getResolvedTheme();
  const dotTheme = getDotStylesByTheme(resolvedTheme);

  const dot = document.createElement("div");

  const dotSize = state === "error" ? 20 : state === "loading" ? 10 : 9;

  dot.style.width = `${dotSize}px`;
  dot.style.height = `${dotSize}px`;
  dot.style.minWidth = `${dotSize}px`;
  dot.style.minHeight = `${dotSize}px`;
  dot.style.aspectRatio = "1 / 1";
  dot.style.boxSizing = "border-box";
  dot.style.padding = "0";
  dot.style.margin = "0";
  dot.style.borderRadius = "50%";
  dot.style.background = getDotColor(state, resolvedTheme);
  dot.style.border = dotTheme.border;
  dot.style.boxShadow =
    state === "loading" ? dotTheme.shadowLoading : dotTheme.shadowIdle;
  dot.style.display = "flex";
  dot.style.alignItems = "center";
  dot.style.justifyContent = "center";
  dot.style.flexShrink = "0";
  dot.style.color = "#ffffff";
  dot.style.fontSize = "10px";
  dot.style.fontWeight = "700";
  dot.style.lineHeight = "1";
  dot.style.textAlign = "center";
  dot.style.fontVariantNumeric = "tabular-nums";
  dot.style.userSelect = "none";
  dot.style.webkitUserSelect = "none";

  if (state === "error" && errorCount > 0) {
    dot.textContent = errorCount > 9 ? "9+" : String(errorCount);
    dot.style.fontSize = errorCount > 9 ? "8px" : "10px";
  }

  dot.animate(
    state === "loading"
      ? [
          { transform: "scale(0.9)", opacity: 0.55 },
          { transform: "scale(1.18)", opacity: 1 },
          { transform: "scale(0.9)", opacity: 0.55 },
        ]
      : [
          { transform: "scale(0.94)", opacity: dotTheme.idleOpacityMin },
          { transform: "scale(1.08)", opacity: dotTheme.idleOpacityMax },
          { transform: "scale(0.94)", opacity: dotTheme.idleOpacityMin },
        ],
    {
      duration: state === "loading" ? 900 : 1600,
      iterations: Infinity,
      easing: "ease-in-out",
    },
  );

  wrapper.appendChild(dot);
  return wrapper;
};
