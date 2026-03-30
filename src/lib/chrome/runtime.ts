import type { CheckResponse } from "../../content/core/types";
import { CHECK_TEXT_MESSAGE } from "../constants";

export const sendCheckTextMessage = async (
  text: string,
): Promise<CheckResponse> => {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(
        new Error(
          "Extension context old or unavailable. Tab-aa refresh hiine uu.",
        ),
      );
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: CHECK_TEXT_MESSAGE,
        payload: { text },
      },
      (response: CheckResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(response);
      },
    );
  });
};
