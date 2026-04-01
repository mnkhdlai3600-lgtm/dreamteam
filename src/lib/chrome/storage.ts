import { DEFAULT_THEME_MODE, THEME_MODE_KEY } from "../constants";

export const getFromStorage = async <T>(
  key: string,
  fallback: T,
): Promise<T> => {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) {
      resolve(fallback);
      return;
    }

    chrome.storage.sync.get([key], (result) => {
      resolve((result[key] as T) ?? fallback);
    });
  });
};

export const setToStorage = async <T>(key: string, value: T): Promise<void> => {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) {
      resolve();
      return;
    }

    chrome.storage.sync.set({ [key]: value }, () => resolve());
  });
};

export const getThemeMode = () =>
  getFromStorage<string>(THEME_MODE_KEY, DEFAULT_THEME_MODE);

export const setThemeMode = (value: string) =>
  setToStorage(THEME_MODE_KEY, value);
