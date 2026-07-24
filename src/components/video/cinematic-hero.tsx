import type { ElementType, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { HeroReveal } from "@/components/motion/hero-reveal";
import { Container } from "@/components/ui/container";
import { HeroBackgroundVideo } from "@/components/video/hero-background-video";
import type { PageMedia } from "@/data/page-media";
import { cn } from "@/lib/utils";

type HeroCta = {
  label: string;
  href: string;
  ariaLabel?: string;
};

type CinematicHeroProps = {
  eyebrow: string;
  heading: string;
  description: string;
  media?: PageMedia;
  headingLevel?: 1 | 2;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  align?: "left" | "center";
  contentWidth?: "standard" | "wide" | "narrow";
  minHeight?: "screen" | "page";
  showScrollCue?: boolean;
  bottomContent?: ReactNode;
  className?: string;
};

const contentWidths = {
  narrow: "max-w-3xl",
  standard: "max-w-5xl",
  wide: "max-w-6xl",
};

export function CinematicHero({
  eyebrow,
  heading,
  description,
  media,
  headingLevel = 1,
  primaryCta,
  secondaryCta,
  align = "left",
  contentWidth = "standard",
  minHeight = "page",
  showScrollCue = false,
  bottomContent,
  className,
}: CinematicHeroProps) {
  const Heading = `h${headingLevel}` as ElementType;
  const isCentered = align === "center";

  return (
    <section
      className={cn(
        "cinematic-field relative isolate flex overflow-hidden pt-28 text-foreground",
        minHeight === "screen" ? "min-h-screen" : "min-h-[78vh]",
        className,
      )}
    >
      <HeroBackgroundVideo
        desktopVideo={media?.desktopVideo}
        mobileVideo={media?.mobileVideo}
        poster={media?.poster}
      />
      {!media?.desktopVideo && media?.desktopImage ? (
        <Image
          src={media.desktopImage}
          alt=""
          fill
          priority
          sizes="100vw"
          style={media.imagePosition ? { objectPosition: media.imagePosition } : undefined}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      ) : null}
      <div
        className="absolute inset-0 -z-10 bg-[rgba(7,25,43,0.2)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 h-32 bg-[linear-gradient(180deg,rgba(7,25,43,0)_0%,rgba(7,25,43,0.32)_38%,#07192b_100%)]"
        aria-hidden="true"
      />

      <Container
        className={cn(
          "flex flex-1 flex-col justify-center py-24 sm:py-32 lg:py-40",
          isCentered && "items-center text-center",
        )}
      >
        <HeroReveal
          className={cn(
            contentWidths[contentWidth],
            "relative",
            isCentered && "mx-auto",
          )}
        >
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.34em] text-accent-yellow sm:text-sm">
            {eyebrow}
          </p>
          <Heading className="font-display max-w-5xl text-4xl font-normal leading-[0.94] tracking-[-0.03em] text-white opacity-100 sm:text-6xl lg:text-7xl">
            {heading}
          </Heading>
          <p
            className={cn(
              "mt-8 max-w-2xl text-lg font-medium leading-8 text-white opacity-100 sm:text-xl",
              isCentered && "mx-auto",
            )}
          >
            {description}
          </p>

          {primaryCta || secondaryCta ? (
            <div
              className={cn(
                "mt-10 flex flex-col gap-4 sm:flex-row",
                isCentered && "items-center justify-center",
              )}
            >
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  aria-label={primaryCta.ariaLabel}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-accent-yellow px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-[#ffe080] focus-visible:outline-accent-yellow"
                >
                  {primaryCta.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  aria-label={secondaryCta.ariaLabel}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-accent-yellow hover:text-accent-yellow focus-visible:outline-accent-yellow"
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </HeroReveal>

        {bottomContent ? (
          <div className="mt-16 w-full max-w-5xl">{bottomContent}</div>
        ) : null}

        {showScrollCue ? (
          <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-muted-light sm:block">
            <ArrowDown aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Scroll to continue</span>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
