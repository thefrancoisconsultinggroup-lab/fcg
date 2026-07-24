"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { ProgramsServicesHero } from "@/components/programs/programs-services-hero";
import { ProgramsServicesPageContent } from "@/components/programs/programs-services-page-content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ProgramsServicesPageScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bodyShellRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const bodyShell = bodyShellRef.current;
      if (!bodyShell) return;

      const heroMedia = sceneRef.current?.querySelector<HTMLElement>("[data-programs-hero-media]");
      const heroOverlay = sceneRef.current?.querySelector<HTMLElement>("[data-programs-hero-overlay]");
      const heroContent = sceneRef.current?.querySelector<HTMLElement>("[data-programs-hero-content]");
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

      timeline.to(bodyShell, { y: 0, scale: 1, opacity: 1, ease: "none" }, 0);

      if (heroMedia) {
        timeline.to(heroMedia, { scale: 1.025, yPercent: -4, ease: "none" }, 0);
      }

      if (heroOverlay) {
        timeline.to(heroOverlay, { opacity: 0.82, ease: "none" }, 0);
      }

      if (heroContent) {
        timeline.to(heroContent, { yPercent: -4, opacity: 0.72, ease: "none" }, 0);
      }
    },
    { scope: sceneRef },
  );

  return (
    <div ref={sceneRef} className="relative overflow-x-clip">
      <ProgramsServicesHero targetId="programs-body" />
      <div
        id="programs-body"
        ref={bodyShellRef}
        className="relative z-10 overflow-hidden"
      >
        <ProgramsServicesPageContent />
      </div>
    </div>
  );
}
