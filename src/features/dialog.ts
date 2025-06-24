import {
  addWFCustomPageLoadFeature,
  afterWebflowReady,
  getGsap,
  getHtmlElement,
  getMultipleHtmlElements,
} from "@taj-wf/utils";
import { preventBodyScroll } from "@zag-js/remove-scroll";

import { PROPERTIES, SELECTORS } from "@/utils/constants";
import { createDialog } from "@/utils/dialog";

let dialogDestroyers: (() => void)[] = [];

const destroyDialogs = () => {
  for (const destroy of dialogDestroyers) {
    destroy();
  }
  dialogDestroyers = [];
};

const initDialogs = () => {
  const dialogWrappers = getMultipleHtmlElements({ selector: "[data-dialog-id]" });

  if (!dialogWrappers) return;

  const [gsap] = getGsap();

  for (const dialogWrapper of dialogWrappers) {
    const dialogId = dialogWrapper.getAttribute(PROPERTIES.dialogId)!;

    const triggerEls = getMultipleHtmlElements({ selector: `[data-dialog-trigger="${dialogId}"]` });

    const closeEls = getMultipleHtmlElements({ selector: SELECTORS.close, parent: dialogWrapper });

    if (!triggerEls || !closeEls) continue;

    const backdropEl = getHtmlElement({ selector: SELECTORS.backdrop, parent: dialogWrapper });

    if (!backdropEl) {
      console.error("Dialog wrapper is missing backdrop element", dialogWrapper);
      continue;
    }

    const titleEl =
      getHtmlElement({ selector: SELECTORS.title, parent: dialogWrapper }) || undefined;
    const descriptionEl =
      getHtmlElement({ selector: SELECTORS.desc, parent: dialogWrapper }) || undefined;

    const smoothScroller = (document.body as HTMLBodyElement)?.smoothScroller;
    let enableBodyScroll: (() => void) | undefined = undefined;

    const dialog = createDialog({
      dialogEl: dialogWrapper,
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
      isGsapAvailable: !!gsap,
    });

    if (!dialog) {
      console.error("Failed to create dialog for", dialogWrapper);
      continue;
    }

    const { destroy } = dialog;

    dialogDestroyers.push(() => {
      destroy();
    });
  }
};

afterWebflowReady(() => {
  initDialogs();

  addWFCustomPageLoadFeature({
    name: "CUSTOM_ACCESSIBLE_DIALOGS",
    async: false,
    init: initDialogs,
    destroy: destroyDialogs,
    reInit: () => {
      destroyDialogs();
      initDialogs();
    },
  });
});
