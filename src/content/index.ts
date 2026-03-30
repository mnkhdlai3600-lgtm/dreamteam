import "./content.css";
import { registerContentEvents } from "./core/events/event";
import { applyInitialAccentColor, watchAccentColorChanges } from "./ui/accents";

console.log("Bolor AI content script loaded v15");

void applyInitialAccentColor();
watchAccentColorChanges();
registerContentEvents();

console.log("NEW MESSENGER FIX LOADED v15");
