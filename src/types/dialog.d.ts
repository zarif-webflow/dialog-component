import { DialogAPI } from './dialog';

declare global {
  /**
   * Extend all HTMLElements so that any element
   * (in particular your dialog container) can have
   * a `.api` property of type DialogAPI.
   */
  interface CustomDialogElement extends HTMLElement {
    dialogApi?: DialogAPI;
  }

  interface DialogOptions {
    dialogEl: CustomDialogElement; // the dialog container
    triggerEls: HTMLElement[]; // one or more elements that open the dialog
    closeEls: HTMLElement[]; // one or more elements that close the dialog
    backdropEl: HTMLElement; // backdrop overlay
    autoFocusInputEl?: HTMLInputElement | 'disable'; // autofocus input control
    titleEl?: HTMLElement; // optional: heading inside dialog for aria-labelledby
    descriptionEl?: HTMLElement; // optional: description inside dialog for aria-describedby
    disableScroll: () => void; // called when dialog opens
    enableScroll: () => void; // called when dialog closes
    onDialogOpen?: () => void; // hook after open
    onDialogClose?: () => void; // hook after close
    isOpen?: boolean;
  }

  interface DialogAPI {
    open(): void;
    close(): void;
    toggle(): void;
  }
}

// mark this file as a module
export {};
