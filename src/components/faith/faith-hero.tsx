"use client";

import Image from "next/image";
import { Container } from "@/components/ui/container";
import { HeroScrollCue } from "@/components/ui/hero-scroll-cue";
import { sitePages } from "@/data/pages";

const page = sitePages.faith;

type FaithHeroProps = {
  targetId?: string;
};

export function FaithHero({ targetId = "faith-quotes" }: FaithHeroProps) {
  return (
    <section
      className="relative isolate overflow-hidden text-foreground"
      data-faith-hero
    >
      <div className="absolute inset-0" data-faith-hero-media>
        <Image
          src="/assets/images/FCG-Faith.jpg"
          alt="A cross silhouetted on a hill at sunset over calm water."
          fill
          priority
          sizes="100vw"
          className="object-cover object-[58%_80%] sm:object-[58%_74%] lg:object-[58%_74%]"
        />
        <div
          className="absolute inset-0 bg-[rgba(7,25,43,0.2)]"
          data-faith-hero-overlay
        />
      </div>

      <Container className="relative z-10 flex min-h-screen min-h-[100svh] min-h-[100dvh] flex-col justify-center pt-28 pb-28 sm:pt-32 sm:pb-32 lg:pt-36 lg:pb-36">
        <div
          className="max-w-4xl pt-12 sm:pt-14 lg:pt-18"
          data-faith-hero-content
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-white/82 sm:mb-5">
            {page.eyebrow}
          </p>
          <h1 className="font-display text-4xl font-normal leading-[0.96] text-white text-balance sm:text-5xl lg:text-7xl">
            {page.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/92 sm:mt-6 sm:text-lg sm:leading-8">
            {page.heroDescription}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[2.3rem]">
          <Container className="flex justify-end">
            <div className="pointer-events-auto">
              <HeroScrollCue href={`#${targetId}`} label="Scroll to explore" />
            </div>
          </Container>
        </div>
      </Container>
    </section>
  );
}
