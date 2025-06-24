import type { GSAPTweenVars } from "@taj-wf/utils";

const commonOpenAnimationProps: GSAPTweenVars = { duration: 0.4, ease: "back.out" };
const commonCloseAnimationProps: GSAPTweenVars = { duration: 0.4, ease: "back.in" };

export type DialogAnimation = (dialogChildrens: HTMLElement[]) => GSAPTween;

export const openAnimations = {
  scaleOut: (dialogChildrens: HTMLElement[]) => {
    return gsap.fromTo(
      dialogChildrens,
      {
        scale: 0.8,
        opacity: 0,
      },
      { scale: 1, opacity: 1, ...commonOpenAnimationProps }
    );
  },
  scaleIn: (dialogChildrens: HTMLElement[]) => {
    return gsap.fromTo(
      dialogChildrens,
      {
        scale: 1.2,
        opacity: 0,
      },
      { scale: 1, opacity: 1, ...commonOpenAnimationProps }
    );
  },
  fadeIn: (dialogChildrens: HTMLElement[]) => {
    return gsap.fromTo(
      dialogChildrens,
      {
        opacity: 0,
      },
      { opacity: 1, ...commonOpenAnimationProps, ease: "power2.inOut" }
    );
  },
  slideFromBottom: (dialogChildrens: HTMLElement[]) => {
    return gsap.fromTo(
      dialogChildrens,
      {
        y: "20%",
        opacity: 0,
      },
      { y: 0, opacity: 1, ...commonOpenAnimationProps }
    );
  },
  slideFromTop: (dialogChildrens: HTMLElement[]) => {
    return gsap.fromTo(
      dialogChildrens,
      {
        y: "-20%",
        opacity: 0,
      },
      { y: 0, opacity: 1, ...commonOpenAnimationProps }
    );
  },
} as const;

export const closeAnimations = {
  scaleOut: (dialogChildrens: HTMLElement[]) => {
    return gsap.to(dialogChildrens, {
      scale: 1.2,
      opacity: 0,
      duration: 0.4,
      ...commonCloseAnimationProps,
    });
  },
  scaleIn: (dialogChildrens: HTMLElement[]) => {
    return gsap.to(dialogChildrens, {
      scale: 0.8,
      opacity: 0,
      duration: 0.4,
      ...commonCloseAnimationProps,
    });
  },
  fadeOut: (dialogChildrens: HTMLElement[]) => {
    return gsap.to(dialogChildrens, {
      opacity: 0,
      duration: 0.4,
      ...commonCloseAnimationProps,
      ease: "power2.inOut",
    });
  },
  slideToBottom: (dialogChildrens: HTMLElement[]) => {
    return gsap.to(dialogChildrens, {
      y: "20%",
      opacity: 0,
      duration: 0.4,
      ...commonCloseAnimationProps,
    });
  },
  slideToTop: (dialogChildrens: HTMLElement[]) => {
    return gsap.to(dialogChildrens, {
      y: "-20%",
      opacity: 0,
      duration: 0.4,
      ...commonCloseAnimationProps,
    });
  },
} as const;

export const backdropAnimations = {
  open: (backdropEl: HTMLElement) => {
    return gsap.from(backdropEl, {
      opacity: 0,
      duration: 0.4,
    });
  },
  close: (backdropEl: HTMLElement) => {
    return gsap.to(backdropEl, {
      opacity: 1,
      duration: 0.4,
    });
  },
};
