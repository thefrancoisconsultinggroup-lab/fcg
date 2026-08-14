"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { HeroScrollCue } from "@/components/ui/hero-scroll-cue";
import { homePageContent } from "@/data/pages/home";
import styles from "./home-immersive-scene.module.css";

const story = homePageContent.sections[0];
const wellness = homePageContent.sections[1];

export function HomeImmersiveScene() {
  const hero = useRef<HTMLElement>(null);
  const [activeProduct, setActiveProduct] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const ensoScale = useTransform(scrollYProgress, [0, 1], [1, reduceMotion ? 1 : 1.08]);
  const ensoY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -78]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -58]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.82], [1, 0]);
  const ensoOpacity = useTransform(scrollYProgress, [0, 0.9], [0.82, 0.38]);
  const products = wellness.cards ?? [];
  const productCount = products.length;

  const showPreviousProduct = () => {
    setActiveProduct((current) => (current - 1 + productCount) % productCount);
  };

  const showNextProduct = () => {
    setActiveProduct((current) => (current + 1) % productCount);
  };

  return (
    <main className={styles.page}>
      <section ref={hero} className={styles.hero}>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <motion.div
          style={{ y: ensoY, scale: ensoScale, opacity: ensoOpacity }}
          className={styles.ensoWrap}
          aria-hidden="true"
        >
          <div className={styles.ensoSpin}>
            <img
              src="/assets/images/enzo.png"
              alt=""
              className={styles.ensoImage}
              loading="eager"
              decoding="async"
            />
          </div>
        </motion.div>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className={styles.heroContent}>
          <p className={styles.heroTagline}>The Human Capacity Company</p>
          <div className={styles.heroStatement}>
            <p className={styles.heroPromise}>
              <span>Building Capacity</span>
              <span>Inspiring Transformation.</span>
              <span>Creating a Legacy</span>
            </p>
            <h1>
              Strengthening <span>Human Capacity</span>
              <br />
              to help people and organizations
              <br />
              thrive in a changing world.
            </h1>
          </div>
        </motion.div>
        <div className={styles.scrollCue}>
          <HeroScrollCue href="#home-intro" label="Scroll to explore" />
        </div>
      </section>

      <section className={styles.welcome}>
        <Reveal className={styles.welcomeWords}>
          <p className={styles.eyebrow}>A personal welcome</p>
          <h2>Welcome</h2>
          <p>Ready to lead your next breakthrough with clarity, wellbeing, and purpose?</p>
        </Reveal>
        <Reveal className={`${styles.mediaReveal} media-frame`}>
          <video
            controls
            playsInline
            preload="metadata"
            aria-label="Welcome video from Francois Consulting Group"
          >
            <source src="/assets/videos/welcome-video-home.mp4" type="video/mp4" />
          </video>
        </Reveal>
      </section>

      <section className={styles.story}>
        <Reveal className={`${styles.portrait} media-frame`}>
          <Image
            src={story.image!.src}
            alt={story.image!.alt}
            fill
            sizes="(min-width: 900px) 45vw, 100vw"
          />
        </Reveal>
        <Reveal className={styles.storyCopy}>
          <h2>{story.heading}</h2>
          {story.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </Reveal>
      </section>

      <section className={styles.wellness}>
        <Reveal>
          <p className={styles.eyebrow}>{wellness.eyebrow}</p>
          <h2>{wellness.heading}</h2>
          <p>{wellness.body?.[0]}</p>
        </Reveal>
        <div className={styles.productStrip} aria-live="polite">
          {products.map((card, index) => {
            const productLink = card.links?.[0];

            return (
              <Reveal
                key={card.title}
                className={styles.productReveal}
                data-active={index === activeProduct ? "true" : "false"}
              >
                <article className={styles.product}>
                  <div className={styles.productIndex}>0{index + 1}</div>
                  {productLink ? (
                    <a
                      href={productLink.href}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.productLink}
                    >
                      {card.image ? (
                        <div className={styles.productImage}>
                          <Image
                            src={card.image.src}
                            alt={card.image.alt}
                            fill
                            sizes="(min-width: 1180px) 18vw, (min-width: 700px) 30vw, 78vw"
                          />
                        </div>
                      ) : null}
                      <h3 className={styles.productName}>{card.title}</h3>
                      {card.body?.map((line) => (
                        <p key={line} className={styles.productTagline}>
                          {line}
                        </p>
                      ))}
                    </a>
                  ) : (
                    <>
                      {card.image ? (
                        <div className={styles.productImage}>
                          <Image
                            src={card.image.src}
                            alt={card.image.alt}
                            fill
                            sizes="(min-width: 1180px) 18vw, (min-width: 700px) 30vw, 78vw"
                          />
                        </div>
                      ) : null}
                      <h3 className={styles.productName}>{card.title}</h3>
                      {card.body?.map((line) => (
                        <p key={line} className={styles.productTagline}>
                          {line}
                        </p>
                      ))}
                    </>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>
        {productCount > 1 ? (
          <div className={styles.carouselControls} aria-label="Neumi product carousel controls">
            <button type="button" onClick={showPreviousProduct} aria-label="Show previous product">
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
            <div className={styles.carouselDots} aria-hidden="true">
              {products.map((product, index) => (
                <span key={product.title} data-active={index === activeProduct ? "true" : "false"} />
              ))}
            </div>
            <button type="button" onClick={showNextProduct} aria-label="Show next product">
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        ) : null}
        <div className={styles.wellnessFooter}>
          <blockquote className={styles.wellnessQuote}>
            <p>
              But seek first the kingdom of God and his righteousness, and all these things will
              be added to you.
            </p>
            <cite>Matthew 6:33</cite>
          </blockquote>
          {wellness.links?.[0] ? (
            <a
              href={wellness.links[0].href}
              target="_blank"
              rel="noreferrer"
              className={styles.shopButton}
            >
              {wellness.links[0].label}
              <ArrowUpRight size={16} />
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Reveal({
  children,
  className,
  "data-active": dataActive,
}: {
  children: React.ReactNode;
  className?: string;
  "data-active"?: "true" | "false";
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      data-active={dataActive}
      initial={reduceMotion ? false : { opacity: 0, y: 56 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
