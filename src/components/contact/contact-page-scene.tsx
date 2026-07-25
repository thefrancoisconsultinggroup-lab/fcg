"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { ContactFormSection } from "@/components/contact/contact-form-section";
import { ContactHero } from "@/components/contact/contact-hero";
import { MigratedPageContent } from "@/components/sections/migrated-page-content";
import { contactPageContent } from "@/data/pages/contact";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ContactPageScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bodyShellRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const bodyShell = bodyShellRef.current;
      if (!bodyShell) return;

      const heroMedia = sceneRef.current?.querySelector<HTMLElement>("[data-contact-hero-media]");
      const heroOverlay = sceneRef.current?.querySelector<HTMLElement>("[data-contact-hero-overlay]");
      const heroContent = sceneRef.current?.querySelector<HTMLElement>("[data-contact-hero-content]");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      if (reduceMotion) {
        gsap.set(bodyShell, { clearProps: "all", opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.set(bodyShell, {
        transformOrigin: "50% 0%",
        scale: isMobile ? 1.05 : 1.12,
        y: isMobile ? "11svh" : "15svh",
        opacity: isMobile ? 0.3 : 0.18,
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
      <ContactHero targetId="contact-body" />
      <div id="contact-body" ref={bodyShellRef} className="relative z-10 overflow-hidden">
        <MigratedPageContent sections={contactPageContent.sections} />
        <ContactFormSection />
      </div>
    </div>
  );
}
