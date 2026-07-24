"use client";

import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Container } from "@/components/ui/container";
import type { ContentImage } from "@/data/pages/types";

type FaithQuoteShowcaseProps = {
  heading: string;
  quotes: ContentImage[];
};

type TransitionVariant = "from-right" | "from-left" | "rise" | "diagonal" | "scale";

const AUTO_ADVANCE_MS = 7500;
const TRANSITION_VARIANTS: TransitionVariant[] = [
  "from-right",
  "from-left",
  "rise",
  "diagonal",
  "scale",
];

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reducedMotion;
}

export function FaithQuoteShowcase({
  heading,
  quotes,
}: FaithQuoteShowcaseProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasEntered, setHasEntered] = useState(false);
  const activeSlideRef = useRef<HTMLDivElement>(null);
  const previewLeftRef = useRef<HTMLDivElement>(null);
  const previewRightRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLElement>(null);
  const timerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const variantIndexRef = useRef(0);
  const variants = useMemo(() => TRANSITION_VARIANTS, []);

  const activeQuote = quotes[activeIndex];
  const previousIndex = wrapIndex(activeIndex - 1, quotes.length);
  const nextIndex = wrapIndex(activeIndex + 1, quotes.length);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAdvance = useCallback(() => {
    clearTimer();
    if (document.visibilityState !== "visible") return;
    timerRef.current = window.setTimeout(() => {
      setDirection(1);
      setActiveIndex((current) => wrapIndex(current + 1, quotes.length));
    }, AUTO_ADVANCE_MS);
  }, [clearTimer, quotes.length]);

  const navigate = useCallback(
    (step: 1 | -1) => {
      setDirection(step);
      setActiveIndex((current) => wrapIndex(current + step, quotes.length));
      scheduleAdvance();
    },
    [quotes.length, scheduleAdvance],
  );

  useEffect(() => {
    scheduleAdvance();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleAdvance();
      } else {
        clearTimer();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [clearTimer, scheduleAdvance]);

  useEffect(() => {
    const node = showcaseRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.32 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      if (!hasEntered || !activeSlideRef.current) return;

      if (reducedMotion) {
        gsap.set(
          [activeSlideRef.current, previewLeftRef.current, previewRightRef.current, controlsRef.current],
          { clearProps: "all", opacity: 1 },
        );
        return;
      }

      gsap.timeline({ defaults: { ease: "power2.out" } })
        .fromTo(
          activeSlideRef.current,
          { y: 36, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.85 },
        )
        .fromTo(
          [previewLeftRef.current, previewRightRef.current],
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
          "-=0.45",
        )
        .fromTo(
          controlsRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.55 },
          "-=0.38",
        );
    },
    { dependencies: [hasEntered, reducedMotion], scope: showcaseRef },
  );

  useGSAP(
    () => {
      if (!activeSlideRef.current || !previewLeftRef.current || !previewRightRef.current) return;

      const variant = variants[variantIndexRef.current % variants.length];
      variantIndexRef.current += 1;

      if (reducedMotion) {
        gsap.fromTo(
          activeSlideRef.current,
          { opacity: 0.2 },
          { opacity: 1, duration: 0.35, ease: "power1.out" },
        );
        return;
      }

      const baseEnter =
        variant === "from-right"
          ? { xPercent: direction > 0 ? 10 : -5, yPercent: 0, scale: 0.985 }
          : variant === "from-left"
            ? { xPercent: direction > 0 ? 5 : -10, yPercent: 0, scale: 0.985 }
            : variant === "rise"
              ? { xPercent: 0, yPercent: 8, scale: 0.987 }
              : variant === "diagonal"
                ? { xPercent: direction > 0 ? 7 : -7, yPercent: 5, scale: 0.985 }
                : { xPercent: 0, yPercent: 0, scale: 0.955 };

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        activeSlideRef.current,
        {
          opacity: 0,
          xPercent: baseEnter.xPercent,
          yPercent: baseEnter.yPercent,
          scale: baseEnter.scale,
          clipPath: "inset(8% 10% 10% 10% round 28px)",
        },
        {
          opacity: 1,
          xPercent: 0,
          yPercent: 0,
          scale: 1,
          clipPath: "inset(0% 0% 0% 0% round 28px)",
          duration: 0.9,
        },
      ).fromTo(
        [previewLeftRef.current, previewRightRef.current],
        {
          opacity: 0.3,
          scale: 0.94,
          xPercent: 0,
        },
        {
          opacity: 0.72,
          scale: 1,
          duration: 0.7,
          stagger: 0.05,
        },
        "-=0.62",
      );
    },
    { dependencies: [activeIndex, direction, reducedMotion, variants], scope: showcaseRef },
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    },
    [navigate],
  );

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartXRef.current == null) return;
      const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
      const delta = endX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(delta) < 36) return;
      navigate(delta < 0 ? 1 : -1);
    },
    [navigate],
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.pointerType === "touch") return;
    pointerStartXRef.current = event.clientX;
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerStartXRef.current == null || !event.isPrimary || event.pointerType === "touch") return;
      const delta = event.clientX - pointerStartXRef.current;
      pointerStartXRef.current = null;
      if (Math.abs(delta) < 42) return;
      navigate(delta < 0 ? 1 : -1);
    },
    [navigate],
  );

  const onPointerCancel = useCallback(() => {
    pointerStartXRef.current = null;
  }, []);

  const leftPreview = quotes[previousIndex];
  const rightPreview = quotes[nextIndex];

  return (
    <section
      ref={showcaseRef}
      className="relative overflow-hidden py-24 text-foreground sm:py-30 lg:min-h-[88svh] lg:py-36"
      aria-label="Bible quote showcase"
      onKeyDown={onKeyDown}
    >
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent-cyan">
                Faith Reflections
              </p>
              <h2 className="ocean-readable font-display text-3xl font-normal leading-tight text-balance sm:text-4xl lg:text-[3.4rem]">
                {heading}
              </h2>
              <p className="ocean-readable mt-4 max-w-2xl text-base font-medium leading-8 text-muted-light sm:text-lg">
                Scripture-led visual reflections presented one quote at a time.
              </p>
            </div>

            <div
              ref={controlsRef}
              className="flex items-center justify-between gap-5 sm:justify-start"
            >
              <div className="font-display text-lg tracking-[0.18em] text-white/78" aria-live="polite">
                {String(activeIndex + 1).padStart(2, "0")} / {String(quotes.length).padStart(2, "0")}
              </div>
              <div className="h-px w-20 bg-white/18" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Show previous quote"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/8 text-white transition hover:border-accent-yellow hover:text-accent-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-yellow"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Show next quote"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/8 text-white transition hover:border-accent-yellow hover:text-accent-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-yellow"
                  onClick={() => navigate(1)}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div
            className="relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            tabIndex={0}
          >
            <div className="relative mx-auto flex min-h-[72svh] items-center justify-center sm:min-h-[78svh] lg:min-h-[82svh]">
              <div
                ref={previewLeftRef}
                className="pointer-events-none absolute left-0 top-1/2 hidden w-[29%] -translate-x-[34%] -translate-y-1/2 lg:block"
                aria-hidden="true"
              >
                <PreviewSlide image={leftPreview} side="left" />
              </div>

              <div
                ref={previewRightRef}
                className="pointer-events-none absolute right-0 top-1/2 hidden w-[29%] translate-x-[34%] -translate-y-1/2 lg:block"
                aria-hidden="true"
              >
                <PreviewSlide image={rightPreview} side="right" />
              </div>

              <div
                ref={activeSlideRef}
                className="relative z-10 w-full max-w-[min(92vw,58rem)]"
              >
                <article
                  className="media-frame relative flex min-h-[58svh] items-center justify-center overflow-hidden rounded-[28px] border-white/18 bg-[#081728]/70 p-4 shadow-[0_34px_90px_rgba(2,11,29,0.42)] sm:min-h-[64svh] sm:p-5 lg:min-h-[70svh] lg:p-6"
                  aria-roledescription="slide"
                  aria-label={`Quote ${activeIndex + 1} of ${quotes.length}`}
                >
                  <div className="relative h-full min-h-[52svh] w-full sm:min-h-[58svh] lg:min-h-[64svh]">
                    <Image
                      src={activeQuote.src}
                      alt={activeQuote.alt}
                      fill
                      priority={activeIndex === 0}
                      sizes="(min-width: 1280px) 58rem, (min-width: 768px) 86vw, 94vw"
                      className="object-contain"
                    />
                  </div>
                </article>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:hidden">
              <MobilePreview image={leftPreview} label="Previous quote preview" />
              <MobilePreview image={rightPreview} label="Next quote preview" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PreviewSlide({
  image,
  side,
}: {
  image: ContentImage;
  side: "left" | "right";
}) {
  return (
    <div
      className={[
        "media-frame relative aspect-[4/5] overflow-hidden rounded-[26px] border-white/12 bg-[#07192b]/50 opacity-75",
        side === "left" ? "origin-right" : "origin-left",
      ].join(" ")}
    >
      <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(7,25,43,0.10),rgba(7,25,43,0.34))]" />
      <Image
        src={image.src}
        alt=""
        fill
        sizes="28vw"
        className="object-contain p-4"
      />
    </div>
  );
}

function MobilePreview({
  image,
  label,
}: {
  image: ContentImage;
  label: string;
}) {
  return (
    <div className="media-frame relative aspect-[4/3] overflow-hidden rounded-[22px] border-white/12 bg-[#07192b]/44">
      <span className="sr-only">{label}</span>
      <Image
        src={image.src}
        alt=""
        fill
        sizes="44vw"
        className="object-contain p-3 opacity-78"
      />
    </div>
  );
}
