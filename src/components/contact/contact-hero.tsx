"use client";

import { HeroScrollCue } from "@/components/ui/hero-scroll-cue";
import { Container } from "@/components/ui/container";
import { HeroBackgroundVideo } from "@/components/video/hero-background-video";
import { pageMedia } from "@/data/page-media";
import type { PageMedia } from "@/data/page-media";
import { sitePages } from "@/data/pages";

const page = sitePages.contact;
const media: PageMedia = pageMedia[page.mediaKey];

type ContactHeroProps = {
  targetId?: string;
};

export function ContactHero({ targetId = "contact-body" }: ContactHeroProps) {
  return (
    <section className="relative isolate overflow-hidden text-foreground" data-contact-hero>
      <div className="absolute inset-0 -z-20" data-contact-hero-media>
        <HeroBackgroundVideo
          desktopVideo={media.desktopVideo}
          mobileVideo={media.mobileVideo}
          poster={media.poster}
        />
      </div>
      <div
        className="absolute inset-0 -z-10 bg-[rgba(7,25,43,0.2)]"
        data-contact-hero-overlay
      />

      <Container className="relative z-10 flex min-h-screen min-h-[100svh] min-h-[100dvh] flex-col justify-center pt-28 pb-28 sm:pt-32 sm:pb-32 lg:pt-36 lg:pb-36">
        <div className="max-w-5xl pt-12 sm:pt-14 lg:pt-18" data-contact-hero-content>
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
