"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { AboutHero } from "@/components/about/about-hero";
import { AboutPageContent } from "@/components/about/about-page-content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function AboutPageScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bodyShellRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const bodyShell = bodyShellRef.current;
      if (!bodyShell) return;

      const heroMedia = sceneRef.current?.querySelector<HTMLElement>("[data-about-hero-media]");
      const heroOverlay = sceneRef.current?.querySelector<HTMLElement>("[data-about-hero-overlay]");
      const heroContent = sceneRef.current?.querySelector<HTMLElement>("[data-about-hero-content]");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      if (reduceMotion) {
        gsap.set(bodyShell, { clearProps: "all", opacity: 1, y: 0, scale: 1 });
        return;
      }

      const startScale = isMobile ? 1.05 : 1.12;
      const startY = isMobile ? "11svh" : "15svh";
      const startOpacity = isMobile ? 0.3 : 0.18;

      gsap.set(bodyShell, {
        transformOrigin: "50% 0%",
        scale: startScale,
        y: startY,
        opacity: startOpacity,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: bodyShell,
          start: "top bottom",
          end: isMobile ? "top 32%" : "top 18%",
          scrub: 0.9,
        },
      });

      timeline.to(
        bodyShell,
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
      <AboutHero targetId="about-body" />
      <div
        id="about-body"
        ref={bodyShellRef}
        className="relative z-10 overflow-hidden"
      >
        <AboutPageContent />
      </div>
    </div>
  );
}
