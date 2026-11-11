/**
 * Scent Palace BD Shared Motion System
 *
 * Designed for luxury editorial cadence:
 * - Shared ease curve: cubic-bezier(0.22, 1, 0.36, 1)
 * - Micro-interactions: 160–220ms
 * - Galleries and panels: 250–350ms
 * - Editorial reveals: 550–750ms
 * - Stagger interval: 50–70ms (capped so visible content appears promptly)
 * - Reveal translation: 12–24px
 */

export const LUXURY_EASE = [0.22, 1, 0.36, 1] as const;

export const transitionTokens = {
  micro: { duration: 0.2, ease: LUXURY_EASE },
  panel: { duration: 0.32, ease: LUXURY_EASE },
  editorial: { duration: 0.65, ease: LUXURY_EASE },
  heroSettle: { duration: 0.9, ease: LUXURY_EASE },
  stagger: 0.06,
};

// Editorial Section Reveal (fades in and translates upward gently)
export const fadeInReveal = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: LUXURY_EASE,
    },
  },
};

// Subtle Scale Settle (e.g. for banners & images, from 1.035 to 1.0 or 0.98 to 1.0)
export const scaleSettle = {
  hidden: { opacity: 0, scale: 1.035 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: LUXURY_EASE,
    },
  },
};

// Stagger Container
export const staggerContainer = (staggerDelay = 0.06, delayChildren = 0.08) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

// Card Reveal for Grid Rows
export const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: LUXURY_EASE,
    },
  },
};

// Subtle Fade
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: LUXURY_EASE,
    },
  },
};

// Viewport trigger setting (triggers once per section without replaying on state updates)
export const viewportOnce = {
  once: true,
  amount: 0.15,
};

