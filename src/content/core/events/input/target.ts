import { getEventEditableTarget } from "../../../dom";
import {
  getGoogleDocsIframeBody,
  isGoogleDocsSite,
  resolveGoogleDocsActiveEditable,
} from "../../../dom/google-docs";
import { getLastEditableElement } from "../../state";

export const resolveInputTarget = (event: Event) => {
  const direct = getEventEditableTarget(event);
  if (direct) return direct;

  if (isGoogleDocsSite()) {
    const docsActive = resolveGoogleDocsActiveEditable();
    if (docsActive) return docsActive;

    const iframeBody = getGoogleDocsIframeBody();
    if (iframeBody) return iframeBody;

    const lastEditable = getLastEditableElement();
    if (lastEditable) return lastEditable;
  }

  return null;
};
