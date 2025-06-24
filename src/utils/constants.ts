export const SELECTORS = {
  dialogWrapper: "[data-dialog-id]",
  close: "[data-dialog-close]",
  backdrop: "[data-dialog-backdrop]",
  title: "[data-dialog-title]",
  desc: "[data-dialog-desc]",
} as const;

export const PROPERTIES = {
  dialogId: "data-dialog-id",
  animation: "data-dialog-animation",
} as const;

export const ANIMATION_TYPES = [
  "slide-from-top",
  "slide-from-bottom",
  "fade-in",
  "scale-out",
  "scale-in",
] as const;

export type AnimationType = (typeof ANIMATION_TYPES)[number];
