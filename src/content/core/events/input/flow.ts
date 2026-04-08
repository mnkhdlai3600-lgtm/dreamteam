import {
  syncGoogleDocsTextCache,
  resolveGoogleDocsActiveEditable,
  getGoogleDocsIframeBody,
  isGoogleDocsSite,
} from "../../../dom/google-docs";
import { updateIndicatorPosition } from "../../../ui";
import { handleInput } from "../../checker";
import { renderSuggestionIndicator } from "../../checker/render";
import { shouldSkipHandleInput } from "../../guard";
import {
  clearSuggestion,
  getLastEditableElement,
  hasSuggestions,
  isSuggestionLoading,
  setActiveElement,
  setSuggestionPhase,
} from "../../state";
import { resolveInputTarget } from "./target";

export const runInputFlow = (event: Event, source: string) => {
  console.log("[болор][input-event]", {
    source,
    type: event.type,
    target: event.target,
    docs: isGoogleDocsSite(),
  });

  if (isGoogleDocsSite()) {
    syncGoogleDocsTextCache(event.target);
  }

  if (shouldSkipHandleInput()) {
    console.log("[болор][input-event] skipped");
    return;
  }

  const target = resolveInputTarget(event);

  console.log("[болор][input-event] resolved-target", {
    target,
    docsActive: isGoogleDocsSite() ? resolveGoogleDocsActiveEditable() : null,
    iframeBody: isGoogleDocsSite() ? getGoogleDocsIframeBody() : null,
    lastEditable: getLastEditableElement(),
  });

  if (!target) return;

  setActiveElement(target);

  const hadSuggestionUi = hasSuggestions() || isSuggestionLoading;

  if (hadSuggestionUi) {
    clearSuggestion();
    setSuggestionPhase("typing");
    void renderSuggestionIndicator();
  } else {
    setSuggestionPhase("typing");
    updateIndicatorPosition(target);
  }

  handleInput(event);
};
