"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type CoreValue = {
  title: string;
  body: string;
};

type CoreValuesAccordionProps = {
  values: CoreValue[];
};

export function CoreValuesAccordion({ values }: CoreValuesAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const baseId = useId();

  return (
    <div className="space-y-1">
      {values.map((value, index) => {
        const isOpen = index === openIndex;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={value.title} className="border-b border-white/10 py-1">
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(index)}
              className="flex w-full items-start gap-4 py-5 text-left focus-visible:outline-accent-yellow"
            >
              <span className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent-cyan/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span
                  className={cn(
                    "font-display block text-[1.35rem] font-normal leading-tight transition-colors sm:text-[1.55rem]",
                    isOpen ? "text-accent-yellow" : "text-white",
                  )}
                >
                  {value.title}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/14 text-base transition-all",
                  isOpen ? "border-accent-cyan/45 text-accent-cyan" : "text-white/78",
                )}
              >
                <span
                  className={cn(
                    "block transition-transform duration-300",
                    isOpen ? "rotate-45" : "rotate-0",
                  )}
                >
                  +
                </span>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduceMotion ? false : { height: 0, opacity: 0, y: -6 }}
                  animate={reduceMotion ? { height: "auto", opacity: 1 } : { height: "auto", opacity: 1, y: 0 }}
                  exit={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, y: -6 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="max-w-2xl pb-6 pl-[2.4rem] pr-8 text-base leading-8 text-muted-light sm:text-[1.05rem]">
                    {value.body}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
