import { trackInteractOutside } from '@zag-js/interact-outside';

/** Utility: generate a random ID */
function randomId(prefix = 'id') {
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
  ].join(',');

  return Array.from(el.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (n) => n.offsetWidth || n.offsetHeight || n === document.activeElement
  );
}

export function createDialog(opts: DialogOptions): DialogAPI {
  const {
    dialogEl,
    triggerEls,
    closeEls,
    backdropEl,
    disableScroll,
    enableScroll,
    onDialogOpen,
    onDialogClose,
    autoFocusInputEl,
    descriptionEl,
    titleEl,
  } = opts;

  let defaultOpen = opts.isOpen ?? false;

  const triggers = triggerEls;
  const closers = closeEls;

  // 1) Ensure IDs only where needed for aria and share a common prefix
  const prefix = randomId('Dialog');
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

  // 2) ARIA attributes
  // only apply aria to a single trigger
  if (triggers.length === 1) {
    const btn = triggers[0]!;
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-controls', dialogEl.id);
  }

  dialogEl.setAttribute('role', 'dialog');
  dialogEl.setAttribute('aria-modal', 'true');
  dialogEl.setAttribute(
    'aria-labelledby',
    titleEl ? titleEl.id : triggers.length === 1 ? triggers[0]!.id : dialogEl.id
  );
  if (descriptionEl) {
    dialogEl.setAttribute('aria-describedby', descriptionEl.id);
  }

  // 3) State
  let isOpen = false; // initial state
  let focusables: HTMLElement[] = [];
  let cleanupInteractOutside: (() => void) | null = null;

  // 4) Open logic
  function open() {
    if (isOpen) return;
    isOpen = true;
    disableScroll(); // stop page scroll

    dialogEl.style.removeProperty('display'); // show dialog
    focusables = getFocusable(dialogEl);
    // Auto‐focus logic
    if (autoFocusInputEl !== 'disable') {
      const target =
        autoFocusInputEl instanceof HTMLInputElement
          ? autoFocusInputEl
          : (dialogEl.querySelector('input') as HTMLInputElement | null);
      target?.focus();
    }
    // trap outside clicks to close
    cleanupInteractOutside = trackInteractOutside(dialogEl, {
      onPointerDownOutside: close,
      onInteractOutside: close,
      onFocusOutside: close,
    });
    // hook
    onDialogOpen?.();
  }

  // 5) Close logic
  function close() {
    isOpen = false;
    enableScroll(); // re-enable scroll

    dialogEl.style.display = 'none'; // hide dialog

    cleanupInteractOutside?.();
    triggers[0]!.focus(); // restore focus
    onDialogClose?.();
  }

  // 6) Toggle
  function toggle() {
    isOpen ? close() : open();
  }

  if (defaultOpen) {
    open();
  } else {
    dialogEl.classList.remove('is--hidden');
    close();
  }

  // 7) Keyboard & focus trap inside dialog
  dialogEl.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
    if (e.key === 'Tab') {
      // cycle focus
      focusables = getFocusable(dialogEl);
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
  });

  // 8) Wire trigger(s) for open
  triggers.forEach((el) => el.addEventListener('click', open));

  // wire close(s)
  closers.forEach((el) => el.addEventListener('click', close));
  backdropEl.addEventListener('click', close);

  const api: DialogAPI = { open, close, toggle };
  dialogEl.dialogApi = api; // attach API to dialog element
  dialogEl.setAttribute('data-dialog-initialized', 'true');
  return api;
}
