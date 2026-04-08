import { activeElement } from "../../core/state";
import {
  getGoogleDocsIframeBody,
  isGoogleDocsSite,
  resolveGoogleDocsActiveEditable,
} from "../google-docs";
import { getSelectionElement } from "./guards";
import { getDocsEditableFromTarget, getEditableElement } from "./roots";
import { isGmailSite } from "./sites";

export const getEventEditableTarget = (event: Event) => {
  if (isGoogleDocsSite()) {
    const directDocsEditable = getDocsEditableFromTarget(event.target);
    if (directDocsEditable) return directDocsEditable;

    if (typeof event.composedPath === "function") {
      for (const item of event.composedPath()) {
        const docsEditable = getDocsEditableFromTarget(item);
        if (docsEditable) return docsEditable;
      }
    }

    return getGoogleDocsIframeBody() ?? resolveGoogleDocsActiveEditable();
  }

  if (typeof event.composedPath === "function") {
    for (const item of event.composedPath()) {
      const editable = getEditableElement(item);
      if (editable) return editable;
    }
  }

  if (isGmailSite()) {
    const fromSelection = getEditableElement(getSelectionElement());
    if (fromSelection) return fromSelection;
  }

  return getEditableElement(event.target);
};

export const resolveActiveEditable = () => {
  if (isGmailSite()) {
    const fromSelection = getEditableElement(getSelectionElement());
    if (fromSelection) return fromSelection;
  }

  if (isGoogleDocsSite()) {
    const docsEditable = resolveGoogleDocsActiveEditable();
    if (docsEditable) return docsEditable;

    const selectionElement = getSelectionElement();
    if (selectionElement) {
      const selectionDocsEditable = getDocsEditableFromTarget(selectionElement);
      if (selectionDocsEditable) return selectionDocsEditable;
    }

    return activeElement;
  }

  const current = document.activeElement;
  const fromActive = current ? getEditableElement(current) : null;
  if (fromActive) return fromActive;

  const fromSelection = getEditableElement(getSelectionElement());
  if (fromSelection) return fromSelection;

  return activeElement;
};
