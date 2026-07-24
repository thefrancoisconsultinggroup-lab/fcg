"use client";

import { ArrowDown } from "lucide-react";

type HeroScrollCueProps = {
  href: string;
  label?: string;
};

export function HeroScrollCue({
  href,
  label = "Scroll to explore",
}: HeroScrollCueProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-3 text-[0.67rem] font-semibold uppercase tracking-[0.18em] text-white transition hover:text-accent-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-yellow motion-safe:animate-bounce"
    >
      <ArrowDown size={17} aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
