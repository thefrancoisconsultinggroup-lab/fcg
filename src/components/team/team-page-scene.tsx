"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { TeamHero } from "@/components/team/team-hero";
import { TeamPageContent } from "@/components/team/team-page-content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function TeamPageScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bodyShellRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const bodyShell = bodyShellRef.current;
      if (!bodyShell) return;

      const heroContent = sceneRef.current?.querySelector<HTMLElement>("[data-team-hero-content]");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      if (reduceMotion) {
        gsap.set(bodyShell, { clearProps: "all", opacity: 1, y: 0, scale: 1 });
        return;
      }

      const startScale = isMobile ? 1.04 : 1.08;
      const startY = isMobile ? "10svh" : "13svh";
      const startOpacity = isMobile ? 0.34 : 0.2;

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
          end: isMobile ? "top 34%" : "top 18%",
          scrub: 0.9,
        },
      });

      timeline.to(bodyShell, { y: 0, scale: 1, opacity: 1, ease: "none" }, 0);

      if (heroContent) {
        timeline.to(heroContent, { yPercent: -4, opacity: 0.74, ease: "none" }, 0);
      }
    },
    { scope: sceneRef },
  );

  return (
    <div ref={sceneRef} className="relative overflow-x-clip">
      <TeamHero targetId="team-body" />
      <div id="team-body" ref={bodyShellRef} className="relative z-10 overflow-hidden">
        <TeamPageContent />
      </div>
    </div>
  );
}
