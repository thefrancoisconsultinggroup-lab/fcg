"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { FaithHero } from "@/components/faith/faith-hero";
import { FaithQuoteShowcase } from "@/components/faith/faith-quote-showcase";
import type { ContentImage } from "@/data/pages/types";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type FaithPageSceneProps = {
  heading: string;
  quotes: ContentImage[];
};

export function FaithPageScene({ heading, quotes }: FaithPageSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const quoteShellRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const quoteShell = quoteShellRef.current;
      if (!quoteShell) return;

      const heroMedia = sceneRef.current?.querySelector<HTMLElement>("[data-faith-hero-media]");
      const heroOverlay = sceneRef.current?.querySelector<HTMLElement>("[data-faith-hero-overlay]");
      const heroContent = sceneRef.current?.querySelector<HTMLElement>("[data-faith-hero-content]");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      if (reduceMotion) {
        gsap.set(quoteShell, { clearProps: "all", opacity: 1, y: 0, scale: 1 });
        return;
      }

      const startScale = isMobile ? 1.05 : 1.12;
      const startY = isMobile ? "11svh" : "15svh";
      const startOpacity = isMobile ? 0.3 : 0.18;

      gsap.set(quoteShell, {
        transformOrigin: "50% 0%",
        scale: startScale,
        y: startY,
        opacity: startOpacity,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: quoteShell,
          start: "top bottom",
          end: isMobile ? "top 32%" : "top 18%",
          scrub: 0.9,
        },
      });

      timeline.to(
        quoteShell,
        {
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "none",
        },
        0,
      );

      if (heroMedia) {
        timeline.to(
          heroMedia,
          {
            scale: 1.025,
            yPercent: -4,
            ease: "none",
          },
          0,
        );
      }

      if (heroOverlay) {
        timeline.to(
          heroOverlay,
          {
            opacity: 0.82,
            ease: "none",
          },
          0,
        );
      }

      if (heroContent) {
        timeline.to(
          heroContent,
          {
            yPercent: -4,
            opacity: 0.72,
            ease: "none",
          },
          0,
        );
      }
    },
    { scope: sceneRef },
  );

  return (
    <div ref={sceneRef} className="relative overflow-x-clip">
      <FaithHero targetId="faith-quotes" />
      <div
        id="faith-quotes"
        ref={quoteShellRef}
        className="relative z-10 -mt-[14svh] overflow-hidden pt-[14svh] sm:-mt-[16svh] sm:pt-[16svh]"
      >
        <FaithQuoteShowcase heading={heading} quotes={quotes} />
      </div>
    </div>
  );
}
