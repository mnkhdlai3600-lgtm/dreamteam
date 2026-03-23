console.log("Bolor AI content script loaded");

const INDICATOR_ID = "bolor-ai-indicator";

let activeElement: HTMLElement | null = null;
let debounceTimer: number | null = null;
let latestSuggestion: string | null = null;

const removeIndicator = () => {
  const existing = document.getElementById(INDICATOR_ID);
  if (existing) existing.remove();
};

const createIndicator = (target: HTMLElement, text = "Bolor AI idevhtei") => {
  removeIndicator();

  const rect = target.getBoundingClientRect();

  const div = document.createElement("div");
  div.id = INDICATOR_ID;
  div.textContent = text;
  div.style.position = "fixed";
  div.style.top = `${rect.bottom + 8}px`;
  div.style.left = `${rect.left}px`;
  div.style.zIndex = "999999";
  div.style.padding = "8px 12px";
  div.style.borderRadius = "8px";
  div.style.background = "#111";
  div.style.color = "#fff";
  div.style.fontSize = "13px";
  div.style.fontFamily = "Arial, sans-serif";
  div.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  div.style.maxWidth = "420px";
  div.style.whiteSpace = "nowrap";
  div.style.overflow = "hidden";
  div.style.textOverflow = "ellipsis";

  document.body.appendChild(div);
};

const isTextInputElement = (el: Element | null): el is HTMLElement => {
  if (!el) return false;

  if (el instanceof HTMLTextAreaElement) return true;

  if (el instanceof HTMLInputElement) {
    const allowedTypes = ["text", "search", "email", "url", "tel"];
    return allowedTypes.includes(el.type);
  }

  if (el instanceof HTMLElement && el.isContentEditable) return true;

  return false;
};

const getElementText = (el: HTMLElement): string => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }

  if (el.isContentEditable) {
    return el.innerText || "";
  }

  return "";
};

const setElementText = (el: HTMLElement, value: string) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (el.isContentEditable) {
    el.innerText = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
};

const checkWithBackground = async (text: string) => {
  return new Promise<{
    success: boolean;
    data?: {
      original: string;
      corrected: string;
      changed: boolean;
      suggestions: string[];
      mode: "openai-galig" | "bolor-suggest" | "none";
    };
    error?: string;
  }>((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "CHECK_TEXT",
        payload: { text },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(response);
      },
    );
  });
};

const clearSuggestion = () => {
  latestSuggestion = null;
};

const applySuggestion = () => {
  if (!activeElement || !latestSuggestion) return;

  setElementText(activeElement, latestSuggestion);
  createIndicator(activeElement, "Zasvar hereglegdlee");
  clearSuggestion();
};

const checkText = async (text: string) => {
  const trimmed = text.trim();

  if (!trimmed) {
    clearSuggestion();
    return;
  }

  try {
    const response = await checkWithBackground(trimmed);

    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Check failed");
    }

    const data = response.data;
    console.log("Background response:", data);

    if (!activeElement) return;

    if (data.changed) {
      latestSuggestion = data.corrected;

      if (data.mode === "openai-galig") {
        createIndicator(
          activeElement,
          `Tab darj kirill bolgono: ${data.corrected}`,
        );
      } else {
        createIndicator(activeElement, `Tab darj zasna: ${data.corrected}`);
      }
    } else {
      clearSuggestion();
      createIndicator(activeElement, "Aldaa oldsongui");
    }
  } catch (error) {
    clearSuggestion();
    console.error("Check error:", error);

    if (activeElement) {
      createIndicator(
        activeElement,
        error instanceof Error ? error.message : "Holboltiin aldaa",
      );
    }
  }
};

const handleInput = () => {
  if (!activeElement) return;

  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    if (!activeElement) return;
    const text = getElementText(activeElement);
    void checkText(text);
  }, 700);
};

document.addEventListener("focusin", (event) => {
  const target = event.target;

  if (target instanceof Element && isTextInputElement(target)) {
    activeElement = target;
    createIndicator(target);
  }
});

document.addEventListener("focusout", () => {
  setTimeout(() => {
    const active = document.activeElement;

    if (!(active instanceof Element) || !isTextInputElement(active)) {
      activeElement = null;
      clearSuggestion();
      removeIndicator();
    }
  }, 100);
});

document.addEventListener("input", (event) => {
  const target = event.target;

  if (target instanceof Element && isTextInputElement(target)) {
    activeElement = target;
    handleInput();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  if (!activeElement) return;
  if (!latestSuggestion) return;

  event.preventDefault();
  applySuggestion();
});
