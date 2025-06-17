import { preventBodyScroll } from "@zag-js/remove-scroll";

import { createDialog } from "../utils/dialog";

const SELECTORS = {
  dialogWrapper: "[data-dialog-id]",
  close: "[data-dialog-close]",
  backdrop: "[data-dialog-backdrop]",
  title: "[data-dialog-title]",
  desc: "[data-dialog-desc]",
};

const PROPERTIES = {
  dialogId: "data-dialog-id",
};

const initDialogs = () => {
  const dialogWrappers = Array.from(
    document.querySelectorAll<CustomDialogElement>("[data-dialog-id]")
  );

  for (const dialogWrapper of dialogWrappers) {
    const dialogId = dialogWrapper.getAttribute(PROPERTIES.dialogId);

    if (!dialogId) {
      console.warn("Dialog wrapper is missing data-dialog-id attribute", dialogWrapper);
      continue;
    }

    const triggerEls = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-dialog-trigger="${dialogId}"]`)
    );
    const closeEls = Array.from(dialogWrapper.querySelectorAll<HTMLElement>(SELECTORS.close));

    const backdropEl = dialogWrapper.querySelector<HTMLElement>(SELECTORS.backdrop);

    if (!backdropEl) {
      console.error("Dialog wrapper is missing backdrop element", dialogWrapper);
      continue;
    }

    const titleEl = dialogWrapper.querySelector<HTMLElement>(SELECTORS.title) || undefined;
    const descriptionEl = dialogWrapper.querySelector<HTMLElement>(SELECTORS.desc) || undefined;

    const smoothScroller = (document.body as HTMLBodyElement)?.smoothScroller;
    let enableBodyScroll: (() => void) | undefined = undefined;

    createDialog({
      dialogEl: dialogWrapper,
      backdropEl,
      triggerEls,
      closeEls,
      titleEl,
      descriptionEl,
      disableScroll: () => {
        if (smoothScroller) {
          smoothScroller.disableScrolling();
        } else {
          enableBodyScroll = preventBodyScroll();
        }
      },
      enableScroll: () => {
        if (smoothScroller) {
          smoothScroller.enableScrolling();
        } else {
          enableBodyScroll?.();
        }
      },
    });
  }
};

initDialogs();
