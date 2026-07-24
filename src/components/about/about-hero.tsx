"use client";

import Image from "next/image";
import { HeroScrollCue } from "@/components/ui/hero-scroll-cue";
import { Container } from "@/components/ui/container";
import { pageMedia } from "@/data/page-media";
import { sitePages } from "@/data/pages";

const page = sitePages.aboutUs;
const media = pageMedia[page.mediaKey];

type AboutHeroProps = {
  targetId?: string;
};

export function AboutHero({ targetId = "about-body" }: AboutHeroProps) {
  return (
    <section className="relative isolate overflow-hidden text-foreground" data-about-hero>
      <div className="absolute inset-0" data-about-hero-media>
        {media.desktopImage ? (
          <Image
            src={media.desktopImage}
            alt=""
            fill
          priority
          sizes="100vw"
          style={media.imagePosition ? { objectPosition: media.imagePosition } : undefined}
          className="object-cover"
        />
        ) : null}
        <div
          className="absolute inset-0 bg-[rgba(7,25,43,0.3)]"
          data-about-hero-overlay
        />
      </div>

      <Container className="relative z-10 flex min-h-screen min-h-[100svh] min-h-[100dvh] flex-col justify-center pt-28 pb-28 sm:pt-32 sm:pb-32 lg:pt-36 lg:pb-36">
        <div className="max-w-5xl pt-12 sm:pt-14 lg:pt-18" data-about-hero-content>
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
              <HeroScrollCue href={`#${targetId}`} label="Scroll to explore" />
            </div>
          </Container>
        </div>
      </Container>
    </section>
  );
}
