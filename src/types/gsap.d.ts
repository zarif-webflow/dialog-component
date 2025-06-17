/**
 * Global type declarations for libraries loaded via script tags
 */

// Declare GSAP as a global variable with full type support
// This references the installed types without importing the actual module
declare global {
  const gsap: import("gsap").GSAPStatic;
}

// Ensure this is treated as a module to enable global augmentation
export {};
