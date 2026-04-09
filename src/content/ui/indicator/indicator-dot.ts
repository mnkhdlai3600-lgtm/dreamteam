import { getDotStylesByTheme, getResolvedTheme } from "./indicator-theme";

export type IndicatorState = "idle" | "loading" | "latin" | "error" | "success";

let dotRenderToken = 0;

export const buildDotIndicator = async (
  container: HTMLDivElement,
  state: IndicatorState,
  errorCount = 0,
  onClick?: () => void,
) => {
  const renderToken = ++dotRenderToken;

  container.dataset.mode = "dot";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.width = "30px";
  container.style.height = "30px";
  container.style.pointerEvents = state === "error" ? "auto" : "none";
  container.style.cursor = state === "error" ? "pointer" : "default";
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

  container.onclick = null;
  container.onmousedown = null;
  container.onmouseup = null;

  if (state === "error" && onClick) {
    container.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    };

    container.onmouseup = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
  }

  const dotNode = await createBreathingDot(state, errorCount);

  if (renderToken !== dotRenderToken) return;
  if (!container.isConnected) return;
  if (container.dataset.mode !== "dot") return;

  container.replaceChildren(dotNode);
};

const getIdleColorByTheme = (theme: "light" | "dark") => {
  return theme === "dark" ? "#e5e7eb" : "#475569";
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

const getGlowColor = (
  state: IndicatorState,
  resolvedTheme: "light" | "dark",
) => {
  if (state === "latin") return "rgba(250, 204, 21, 0.32)";
  if (state === "error") return "rgba(239, 68, 68, 0.30)";
  if (state === "success") return "rgba(34, 197, 94, 0.28)";
  if (state === "loading") {
    return resolvedTheme === "dark"
      ? "rgba(255,255,255,0.20)"
      : "rgba(71,85,105,0.20)";
  }

  return resolvedTheme === "dark"
    ? "rgba(229,231,235,0.18)"
    : "rgba(71,85,105,0.16)";
};

const createBreathingDot = async (
  state: IndicatorState,
  errorCount: number,
) => {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "30px";
  wrapper.style.height = "30px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.pointerEvents = "none";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.flexShrink = "0";

  const resolvedTheme = await getResolvedTheme();
  const dotTheme = getDotStylesByTheme(resolvedTheme);

  const halo = document.createElement("div");
  halo.style.position = "absolute";
  halo.style.left = "50%";
  halo.style.top = "50%";
  halo.style.width = state === "error" ? "30px" : "24px";
  halo.style.height = state === "error" ? "30px" : "24px";
  halo.style.borderRadius = "999px";
  halo.style.background = getGlowColor(state, resolvedTheme);
  halo.style.transform = "translate(-50%, -50%)";
  halo.style.filter = "blur(8px)";
  halo.style.opacity = state === "idle" ? "0.56" : "0.84";
  halo.style.pointerEvents = "none";

  halo.animate(
    [
      { transform: "translate(-50%, -50%) scale(0.92)", opacity: 0.45 },
      { transform: "translate(-50%, -50%) scale(1.16)", opacity: 0.92 },
      { transform: "translate(-50%, -50%) scale(0.92)", opacity: 0.45 },
    ],
    {
      duration: state === "loading" ? 850 : 1700,
      iterations: Infinity,
      easing: "ease-in-out",
    },
  );

  const dot = document.createElement("div");
  const dotSize = state === "error" ? 24 : state === "loading" ? 13 : 13;

  dot.style.position = "absolute";
  dot.style.left = "50%";
  dot.style.top = "50%";
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
  dot.style.fontSize = "11px";
  dot.style.fontWeight = "800";
  dot.style.lineHeight = "1";
  dot.style.textAlign = "center";
  dot.style.fontVariantNumeric = "tabular-nums";
  dot.style.userSelect = "none";
  dot.style.webkitUserSelect = "none";
  dot.style.pointerEvents = "none";
  dot.style.transform = "translate(-50%, -50%)";

  if (state === "error" && errorCount > 0) {
    dot.textContent = errorCount > 9 ? "9+" : String(errorCount);
    dot.style.fontSize = errorCount > 9 ? "8px" : "11px";
  }

  dot.animate(
    state === "loading"
      ? [
          { transform: "translate(-50%, -50%) scale(0.9)", opacity: 0.58 },
          { transform: "translate(-50%, -50%) scale(1.18)", opacity: 1 },
          { transform: "translate(-50%, -50%) scale(0.9)", opacity: 0.58 },
        ]
      : [
          {
            transform: "translate(-50%, -50%) scale(0.95)",
            opacity: dotTheme.idleOpacityMin,
          },
          {
            transform: "translate(-50%, -50%) scale(1.08)",
            opacity: dotTheme.idleOpacityMax,
          },
          {
            transform: "translate(-50%, -50%) scale(0.95)",
            opacity: dotTheme.idleOpacityMin,
          },
        ],
    {
      duration: state === "loading" ? 900 : 1600,
      iterations: Infinity,
      easing: "ease-in-out",
    },
  );

  wrapper.appendChild(halo);
  wrapper.appendChild(dot);

  return wrapper;
};
