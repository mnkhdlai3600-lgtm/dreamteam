import "./content.css";
import { registerContentEvents } from "./core/events/event";
import { removeIndicator } from "./ui/indicator";

const THEME_MODE_KEY = "themeMode";

console.log("Bolor AI content script loaded v16");

registerContentEvents();

if (chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    if (!changes[THEME_MODE_KEY]) return;

    removeIndicator();
  });
}

console.log("THEME DOT FIX LOADED v16");
