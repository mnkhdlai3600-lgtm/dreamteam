import type { IndicatorState } from "./indicator-dot";

export type IndicatorOptions = {
  suggestions?: string[];
  selectedIndex?: number;
  onSuggestionClick?: (index: number) => void;
  onFixAll?: () => void;
  onDotClick?: () => void;
  state?: IndicatorState;
  errorCount?: number;
};
