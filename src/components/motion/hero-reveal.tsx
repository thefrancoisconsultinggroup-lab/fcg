"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type HeroRevealProps = {
  children: ReactNode;
  className?: string;
};

export function HeroReveal({ children, className }: HeroRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
