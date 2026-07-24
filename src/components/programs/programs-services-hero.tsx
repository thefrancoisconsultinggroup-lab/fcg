"use client";

import Image from "next/image";
import { HeroScrollCue } from "@/components/ui/hero-scroll-cue";
import { Container } from "@/components/ui/container";
import { sitePages } from "@/data/pages";
import { programsServicesHeroImage } from "@/data/pages/programs-services";

const page = sitePages.programsServices;

type ProgramsServicesHeroProps = {
  targetId?: string;
};

export function ProgramsServicesHero({
  targetId = "programs-body",
}: ProgramsServicesHeroProps) {
  return (
    <section className="relative isolate overflow-hidden text-foreground" data-programs-hero>
      <div className="absolute inset-0" data-programs-hero-media>
        <Image
          src={programsServicesHeroImage.src}
          alt={programsServicesHeroImage.alt}
          fill
          priority
          sizes="100vw"
          style={{ objectPosition: programsServicesHeroImage.objectPosition }}
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-[rgba(7,25,43,0.4)]"
          data-programs-hero-overlay
        />
      </div>

      <Container className="relative z-10 flex min-h-screen min-h-[100svh] min-h-[100dvh] flex-col justify-center pt-28 pb-28 sm:pt-32 sm:pb-32 lg:pt-36 lg:pb-36">
        <div className="max-w-5xl pt-12 sm:pt-14 lg:pt-18" data-programs-hero-content>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.34em] text-accent-yellow sm:text-sm">
            {page.eyebrow}
          </p>
          <h1 className="font-display max-w-5xl text-4xl font-normal leading-[0.94] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
            {page.heading}
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-medium leading-8 text-white sm:text-xl">
            {page.heroDescription}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[2.3rem]">
          <Container className="flex justify-end">
            <div className="pointer-events-auto">
              <HeroScrollCue href={`#${targetId}`} label="Explore the programmes" />
            </div>
          </Container>
        </div>
      </Container>
    </section>
  );
}
