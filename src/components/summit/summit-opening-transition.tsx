"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { Container } from "@/components/ui/container";
import { summitHero, summitWhy } from "@/data/human-capacity-summit";
import styles from "./human-capacity-summit.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function SummitOpeningTransition() {
  const transitionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = transitionRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const stage = root.querySelector<HTMLElement>("[data-summit-stage]");
      const firstScene = root.querySelector<HTMLElement>("[data-summit-first-scene]");
      const secondScene = root.querySelector<HTMLElement>("[data-summit-second-scene]");
      const firstContent = root.querySelector<HTMLElement>("[data-summit-first-content]");
      const secondContent = root.querySelector<HTMLElement>("[data-summit-second-content]");

      if (!stage || !firstScene || !secondScene || !firstContent || !secondContent) return;

      gsap.set(stage, { perspective: 1500, transformStyle: "preserve-3d" });
      gsap.set(firstScene, {
        autoAlpha: 1,
        rotateX: 0,
        yPercent: 0,
        z: 0,
        scale: 1,
        scaleY: 1,
        transformOrigin: "50% 18%",
      });
      gsap.set(secondScene, {
        autoAlpha: 0,
        rotateX: -66,
        yPercent: 44,
        z: -140,
        scale: 0.94,
        scaleY: 0.84,
        transformOrigin: "50% 84%",
      });
      gsap.set(secondContent, { autoAlpha: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 1.35)}`,
          scrub: 0.85,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to({}, { duration: 0.12 })
        .to(
          firstScene,
          {
            rotateX: 36,
            yPercent: -16,
            z: -70,
            scale: 0.96,
            scaleY: 0.92,
            autoAlpha: 0.92,
            duration: 0.28,
          },
          0.12,
        )
        .to(firstContent, { autoAlpha: 0.76, duration: 0.22 }, 0.14)
        .to(
          secondScene,
          {
            rotateX: -35,
            yPercent: 10,
            z: -62,
            scale: 0.98,
            scaleY: 0.93,
            autoAlpha: 0.84,
            duration: 0.34,
          },
          0.2,
        )
        .to(
          firstScene,
          {
            rotateX: 72,
            yPercent: -58,
            z: -190,
            scale: 0.88,
            scaleY: 0.72,
            autoAlpha: 0,
            duration: 0.38,
          },
          0.42,
        )
        .to(firstContent, { autoAlpha: 0, duration: 0.2 }, 0.42)
        .to(
          secondScene,
          {
            rotateX: 0,
            yPercent: 0,
            z: 0,
            scale: 1,
            scaleY: 1,
            autoAlpha: 1,
            duration: 0.42,
          },
          0.4,
        )
        .to(secondContent, { autoAlpha: 1, duration: 0.26 }, 0.54)
        .to({}, { duration: 0.12 });

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh, { once: true });
      document.fonts?.ready.then(refresh).catch(() => undefined);

      return () => {
        window.removeEventListener("load", refresh);
      };
    },
    { scope: transitionRef },
  );

  return (
    <section ref={transitionRef} className={styles.openingTransition} aria-label="Summit introduction">
      <div className={styles.openingViewport} data-summit-stage>
        <div className={styles.summitScene} data-summit-second-scene>
          <div className={styles.openingBackground} aria-hidden="true">
            <Image
              src="/assets/summit/human-capacity-summit-why.webp"
              alt=""
              fill
              sizes="100vw"
              className={styles.openingImage}
            />
          </div>
          <Container className={`${styles.openingLayer} ${styles.whyLayer}`}>
            <div id="summit-why" className={styles.whyPanel} data-summit-second-content>
              <h2 id="summit-why-title">{summitWhy.heading}</h2>
              <p>{summitWhy.body}</p>
            </div>
          </Container>
        </div>

        <div className={styles.summitScene} data-summit-first-scene>
          <div className={`${styles.openingBackground} ${styles.openingBackgroundHero}`} aria-hidden="true">
            <Image
              src="/assets/summit/human-capacity-summit-hero.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.openingImage}
            />
          </div>
          <Container className={styles.openingLayer}>
            <div className={styles.heroContent} data-summit-first-content>
              <p className={styles.heroEyebrow}>
                <span>{summitHero.eyebrow}</span>
              </p>
              <h1 id="summit-hero-title" className={styles.heroTitle}>
                <span>{summitHero.lines[0]}</span>
                <span>{summitHero.lines[1]}</span>
                <span>{summitHero.lines[2]}</span>
              </h1>
              <div className={styles.heroStatements}>
                <p className={styles.heroUnityLine}>
                  <span>{summitHero.statements[0]}</span>
                  <span aria-hidden="true">|</span>
                  <span>{summitHero.statements[1]}</span>
                </p>
                <p>{summitHero.statements[2]}</p>
              </div>
              <a className={styles.heroCta} href="#summit-registration">
                {summitHero.cta}
                <ArrowRight aria-hidden="true" className={styles.ctaIcon} />
              </a>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
