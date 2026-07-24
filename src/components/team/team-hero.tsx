"use client";

import { HeroScrollCue } from "@/components/ui/hero-scroll-cue";
import { Container } from "@/components/ui/container";
import { HeroBackgroundVideo } from "@/components/video/hero-background-video";
import { pageMedia } from "@/data/page-media";
import type { PageMedia } from "@/data/page-media";
import { sitePages } from "@/data/pages";
import styles from "./team-hero.module.css";

const page = sitePages.team;
const neumiMedia: PageMedia = pageMedia.neumiWellness;

type TeamHeroProps = {
  targetId?: string;
};

export function TeamHero({ targetId = "team-body" }: TeamHeroProps) {
  return (
    <section className="relative isolate overflow-hidden text-foreground" data-team-hero>
      <div className="absolute inset-0 -z-20" data-team-hero-media>
        <HeroBackgroundVideo
          desktopVideo={neumiMedia.desktopVideo}
          mobileVideo={neumiMedia.mobileVideo}
          poster={neumiMedia.poster}
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[rgba(7,25,43,0.2)]" data-team-hero-overlay />

      <Container className="relative z-10 flex min-h-screen min-h-[100svh] min-h-[100dvh] flex-col justify-center pt-28 pb-28 sm:pt-32 sm:pb-32 lg:pt-36 lg:pb-36">
        <div className={`${styles.heroGrid} pt-12 sm:pt-14 lg:pt-18`}>
          <div className={styles.textColumn} data-team-hero-content>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.34em] text-accent-cyan sm:text-sm">
              {page.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-normal leading-[0.94] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
              {page.heading}
            </h1>
            <p className="mt-8 text-lg font-medium leading-8 text-white sm:text-xl">
              {page.heroDescription}
            </p>
          </div>
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
