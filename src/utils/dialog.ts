import { getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";
import { trackInteractOutside } from "@zag-js/interact-outside";

import {
  backdropAnimations,
  closeAnimations,
  type DialogAnimation,
  openAnimations,
} from "./animations";
import { ANIMATION_TYPES, type AnimationType, PROPERTIES, SELECTORS } from "./constants";

/** Utility: generate a random ID */
function randomId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Utility: find all focusable descendants, excluding tabindex="-1" elements */
function getFocusable(el: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  return Array.from(el.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (n) => n.offsetWidth || n.offsetHeight || n === document.activeElement
  );
}

/** Assign unique IDs to dialog elements for accessibility */
function assignElementIds(opts: {
  dialogEl: HTMLElement;
  triggers: HTMLElement[];
  closers: HTMLElement[];
  backdropEl: HTMLElement;
  titleEl?: HTMLElement;
  descriptionEl?: HTMLElement;
  prefix: string;
}) {
  const { dialogEl, triggers, closers, backdropEl, titleEl, descriptionEl, prefix } = opts;

  if (!dialogEl.id) dialogEl.id = prefix;

  // assign id to single trigger only
  if (triggers.length === 1) {
    const btn = triggers[0]!;
    if (!btn.id) btn.id = `${prefix}-Trigger`;
  }

  // assign id to single closer only
  if (closers.length === 1) {
    const btn = closers[0]!;
    if (!btn.id) btn.id = `${prefix}-Close`;
  }

  backdropEl.id ||= `${prefix}-Backdrop`;
  if (titleEl && !titleEl.id) titleEl.id = `${prefix}-Title`;
  if (descriptionEl && !descriptionEl.id) descriptionEl.id = `${prefix}-Description`;
}

/** Setup ARIA attributes for accessibility */
function setupAriaAttributes(opts: {
  dialogEl: HTMLElement;
  triggers: HTMLElement[];
  titleEl?: HTMLElement;
  descriptionEl?: HTMLElement;
}) {
  const { dialogEl, triggers, titleEl, descriptionEl } = opts;

  // only apply aria to a single trigger
  if (triggers.length === 1) {
    const btn = triggers[0]!;
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-controls", dialogEl.id);
  }

  dialogEl.setAttribute("role", "dialog");
  dialogEl.setAttribute("aria-modal", "true");
  dialogEl.setAttribute(
    "aria-labelledby",
    titleEl ? titleEl.id : triggers.length === 1 ? triggers[0]!.id : dialogEl.id
  );

  if (descriptionEl) {
    dialogEl.setAttribute("aria-describedby", descriptionEl.id);
  }
}

/** Handle dialog open animation */
function createOpenAnimation({
  dialogEl,
  backdropEl,
  childrenElements,
  animation,
}: {
  dialogEl: HTMLElement;
  backdropEl: HTMLElement;
  childrenElements: HTMLElement[];
  animation: DialogAnimation | null;
}) {
  const isAnimationDisabled = dialogEl.hasAttribute("data-dialog-no-animation");

  return function openAnimation() {
    if (dialogEl.classList.contains("is--hidden")) {
      dialogEl.classList.remove("is--hidden");
    }

    if (animation && !isAnimationDisabled) {
      dialogEl.style.removeProperty("display");
      backdropAnimations.open(backdropEl);
      animation(childrenElements);
      return;
    }

    dialogEl.style.removeProperty("display");
  };
}

/** Handle dialog close animation */
function createCloseAnimation({
  dialogEl,
  backdropEl,
  childrenElements,
  animation,
  onComplete,
}: {
  dialogEl: HTMLElement;
  backdropEl: HTMLElement;
  childrenElements: HTMLElement[];
  animation: DialogAnimation | null;
  onComplete?: () => void;
}) {
  const isAnimationDisabled = dialogEl.hasAttribute("data-dialog-no-animation");

  return function closeAnimation() {
    if (animation && !isAnimationDisabled) {
      backdropAnimations.close(backdropEl);
      animation(childrenElements).then(() => {
        dialogEl.style.display = "none";
        onComplete?.();
      });
      return;
    }

    dialogEl.style.display = "none";
    onComplete?.();
  };
}

/** Handle auto-focus logic when dialog opens */
function handleAutoFocus(dialogEl: HTMLElement, autoFocusInputEl?: HTMLInputElement | "disable") {
  if (autoFocusInputEl === "disable") return;

  const target =
    autoFocusInputEl instanceof HTMLInputElement
      ? autoFocusInputEl
      : (dialogEl.querySelector("input") as HTMLInputElement | null);

  target?.focus();
}

/** Handle focus trap cycling */
function handleFocusTrap(e: KeyboardEvent, dialogEl: HTMLElement) {
  const focusables = getFocusable(dialogEl);
  const idx = focusables.indexOf(document.activeElement as HTMLElement);
  const next = e.shiftKey
    ? idx > 0
      ? focusables[idx - 1]
      : focusables[focusables.length - 1]
    : idx < focusables.length - 1
      ? focusables[idx + 1]
      : focusables[0];

  e.preventDefault();
  next?.focus();
}

/** Create keyboard event handler for dialog */
function createKeyboardHandler(
  dialogEl: HTMLElement,
  close: () => void,
  isOpenRef: { current: boolean }
) {
  return function handleKeydown(e: KeyboardEvent) {
    if (!isOpenRef.current) return;

    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }

    if (e.key === "Tab") {
      handleFocusTrap(e, dialogEl);
    }
  };
}

/** Setup event listeners for triggers and closers */
function setupEventListeners(opts: {
  triggers: HTMLElement[];
  closers: HTMLElement[];
  backdropEl: HTMLElement;
  dialogEl: HTMLElement;
  open: () => void;
  close: () => void;
  keydownHandler: (e: KeyboardEvent) => void;
}) {
  const { triggers, closers, backdropEl, dialogEl, open, close, keydownHandler } = opts;

  // Setup trigger listeners
  triggers.forEach((el) => el.addEventListener("click", open));

  // Setup closer listeners
  closers.forEach((el) => el.addEventListener("click", close));
  backdropEl.addEventListener("click", close);

  // Setup keyboard listener
  dialogEl.addEventListener("keydown", keydownHandler);

  // Return cleanup function
  return function cleanup() {
    triggers.forEach((el) => el.removeEventListener("click", open));
    closers.forEach((el) => el.removeEventListener("click", close));
    backdropEl.removeEventListener("click", close);
    dialogEl.removeEventListener("keydown", keydownHandler);
  };
}

/** Remove ARIA attributes that were added during initialization */
function removeAriaAttributes(opts: { dialogEl: HTMLElement; triggers: HTMLElement[] }) {
  const { dialogEl, triggers } = opts;

  // Remove aria from single trigger
  if (triggers.length === 1) {
    const btn = triggers[0]!;
    btn.removeAttribute("aria-haspopup");
    btn.removeAttribute("aria-controls");
  }

  dialogEl.removeAttribute("role");
  dialogEl.removeAttribute("aria-modal");
  dialogEl.removeAttribute("aria-labelledby");
  dialogEl.removeAttribute("aria-describedby");
}

function getAnimations(animationType: string) {
  let finalAnimationType: AnimationType = "scale-out";

  // @ts-expect-error include animation type check
  if (ANIMATION_TYPES.includes(animationType)) {
    finalAnimationType = animationType as AnimationType;
  }

  if (finalAnimationType === "slide-from-top") {
    return { open: openAnimations.slideFromTop, close: closeAnimations.slideToTop };
  }

  if (finalAnimationType === "slide-from-bottom") {
    return { open: openAnimations.slideFromBottom, close: closeAnimations.slideToBottom };
  }

  if (finalAnimationType === "fade-in") {
    return { open: openAnimations.fadeIn, close: closeAnimations.fadeOut };
  }

  if (finalAnimationType === "scale-out") {
    return { open: openAnimations.scaleOut, close: closeAnimations.scaleIn };
  }

  if (finalAnimationType === "scale-in") {
    return { open: openAnimations.scaleIn, close: closeAnimations.scaleOut };
  }

  return { open: openAnimations.slideFromBottom, close: closeAnimations.slideToBottom };
}

type CreateDialogReturn = (DialogAPI & { destroy: () => void }) | null;

export function createDialog(opts: DialogOptions): CreateDialogReturn {
  const {
    dialogEl,
    triggerEls,
    closeEls,
    disableScroll,
    enableScroll,
    onDialogOpen,
    onDialogClose,
    autoFocusInputEl,
    descriptionEl,
    titleEl,
    isGsapAvailable,
  } = opts;

  const backdropEl = getHtmlElement({
    selector: SELECTORS.backdrop,
    parent: dialogEl,
    log: "error",
  });

  if (!backdropEl) return null;

  const dialogChildrenElementsBesidesBackdrop = getMultipleHtmlElements({
    parent: dialogEl,
    selector: `:scope > *:not(${SELECTORS.backdrop})`,
    log: "error",
  });

  if (!dialogChildrenElementsBesidesBackdrop) return null;

  const dialogAnimations = isGsapAvailable
    ? getAnimations(dialogEl.getAttribute(PROPERTIES.animation) || "")
    : null;

  const defaultOpen = opts.isOpen ?? false;
  const triggers = triggerEls;
  const closers = closeEls;

  // Generate unique prefix for this dialog instance
  const prefix = randomId("Dialog");

  // Setup element IDs for accessibility
  assignElementIds({
    dialogEl,
    triggers,
    closers,
    backdropEl,
    titleEl,
    descriptionEl,
    prefix,
  });

  // Setup ARIA attributes
  setupAriaAttributes({
    dialogEl,
    triggers,
    titleEl,
    descriptionEl,
  });

  // Create animation functions
  const openAnimation = createOpenAnimation({
    dialogEl,
    backdropEl,
    childrenElements: dialogChildrenElementsBesidesBackdrop,
    animation: dialogAnimations?.open || null,
  });
  const closeAnimation = createCloseAnimation({
    dialogEl,
    backdropEl,
    childrenElements: dialogChildrenElementsBesidesBackdrop,
    animation: dialogAnimations?.close || null,
    onComplete: () => {
      enableScroll();
    },
  });

  // State management
  let isOpen = false;
  let cleanupInteractOutside: (() => void) | null = null;
  const isOpenRef = { current: false }; // Reference for keyboard handler

  // Core dialog functions
  function open() {
    if (isOpen) return;

    isOpen = true;
    isOpenRef.current = true;
    disableScroll();

    openAnimation();

    handleAutoFocus(dialogEl, autoFocusInputEl);

    // Setup outside interaction tracking
    cleanupInteractOutside = trackInteractOutside(dialogEl, {
      onPointerDownOutside: close,
      onInteractOutside: close,
      onFocusOutside: close,
    });

    onDialogOpen?.();
  }

  function close() {
    isOpen = false;
    isOpenRef.current = false;
    closeAnimation();
    cleanupInteractOutside?.();
    cleanupInteractOutside = null;
    onDialogClose?.();
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function destroy() {
    // Close dialog if open
    if (isOpen) {
      close();
    }

    // Remove event listeners
    cleanupEventListeners();

    // Remove ARIA attributes
    removeAriaAttributes({
      dialogEl,
      triggers,
    });

    // Remove dialog API and initialization marker
    delete dialogEl.dialogApi;
    dialogEl.removeAttribute("data-dialog-initialized");

    // Clear any remaining cleanup
    cleanupInteractOutside?.();
    cleanupInteractOutside = null;
  }

  // Create keyboard handler
  const keydownHandler = createKeyboardHandler(dialogEl, close, isOpenRef);

  // Setup all event listeners and get cleanup function
  const cleanupEventListeners = setupEventListeners({
    triggers,
    closers,
    backdropEl,
    dialogEl,
    open,
    close,
    keydownHandler,
  });

  // Set initial state
  if (defaultOpen) open();

  // Create and attach API
  const api = { open, close, toggle, destroy };
  dialogEl.dialogApi = api;
  dialogEl.setAttribute("data-dialog-initialized", "true");

  return api;
}
