"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 48 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
