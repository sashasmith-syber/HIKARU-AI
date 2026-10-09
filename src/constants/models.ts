export const DEFAULT_TEXT_MODEL = "gemini-3-flash-preview";
export const THINKING_TEXT_MODEL = "gemini-3-pro-preview";
export const EFFICIENCY_TEXT_MODEL = "gemini-2.5-flash-lite-latest";
export const IMAGE_MODEL = "gemini-2.5-flash-image";
export const MAX_THINKING_BUDGET = 32768;

export const TEXT_MODELS = new Set<string>([
  DEFAULT_TEXT_MODEL,
  THINKING_TEXT_MODEL,
  EFFICIENCY_TEXT_MODEL,
]);
