declare global {
  interface HTMLBodyElement {
    /** Optional smooth‐scroller controls */
    smoothScroller?: {
      enableScrolling(): void;
      disableScrolling(): void;
    };
  }
}

export {};
