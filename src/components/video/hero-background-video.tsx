"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type HeroBackgroundVideoProps = {
  desktopVideo?: string;
  mobileVideo?: string;
  poster?: string;
};

export function HeroBackgroundVideo({
  desktopVideo,
  mobileVideo,
  poster,
}: HeroBackgroundVideoProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || failed) {
      videoRef.current?.pause();
    }
  }, [failed, prefersReducedMotion]);

  if (!desktopVideo || prefersReducedMotion !== false || failed) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 h-full w-full object-cover [mask-image:linear-gradient(180deg,black_0%,black_72%,rgba(0,0,0,0.84)_86%,transparent_100%)]",
        "motion-reduce:hidden",
      )}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      onError={() => setFailed(true)}
    >
      {mobileVideo ? (
        <source src={mobileVideo} media="(max-width: 767px)" type="video/mp4" />
      ) : null}
      <source src={desktopVideo} type="video/mp4" />
    </video>
  );
}
