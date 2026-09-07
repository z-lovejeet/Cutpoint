import type { Variants, Transition } from "framer-motion";

export const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const fastEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const defaultTransition: Transition = {
  duration: 0.35,
  ease: fastEase,
};

export const fastTransition: Transition = {
  duration: 0.2,
  ease: fastEase,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: fastEase },
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: fastEase },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: fastEase },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.01,
    },
  },
};

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 6,
    filter: "blur(2px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.22,
      ease: fastEase,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: "blur(1px)",
    transition: {
      duration: 0.14,
      ease: [0.4, 0, 1, 1],
    },
  },
};
