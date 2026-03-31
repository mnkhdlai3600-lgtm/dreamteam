import { getDotStylesByTheme, getResolvedTheme } from "./indicator-theme";

export type IndicatorState = "idle" | "loading";

let dotRenderToken = 0;

export const buildDotIndicator = async (
  container: HTMLDivElement,
  state: IndicatorState,
) => {
  const renderToken = ++dotRenderToken;

  container.dataset.mode = "dot";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.width = "18px";
  container.style.height = "18px";
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

  const dotNode = await createBreathingDot(state);

  if (renderToken !== dotRenderToken) return;
  if (!container.isConnected) return;
  if (container.dataset.mode !== "dot") return;

  container.replaceChildren(dotNode);
};

const createBreathingDot = async (state: IndicatorState) => {
  const wrapper = document.createElement("div");
  wrapper.style.width = "18px";
  wrapper.style.height = "18px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.pointerEvents = "none";

  const resolvedTheme = await getResolvedTheme();
  const dotTheme = getDotStylesByTheme(resolvedTheme);

  const dot = document.createElement("div");
  dot.style.width = state === "loading" ? "9px" : "7px";
  dot.style.height = state === "loading" ? "9px" : "7px";
  dot.style.borderRadius = "999px";
  dot.style.background = dotTheme.background;
  dot.style.border = dotTheme.border;
  dot.style.boxShadow =
    state === "loading" ? dotTheme.shadowLoading : dotTheme.shadowIdle;

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
