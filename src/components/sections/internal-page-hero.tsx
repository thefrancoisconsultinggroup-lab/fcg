import { CinematicHero } from "@/components/video/cinematic-hero";
import { pageMedia } from "@/data/page-media";
import type { SitePage } from "@/data/pages";

type InternalPageHeroProps = {
  page: SitePage;
};

export function InternalPageHero({ page }: InternalPageHeroProps) {
  return (
    <CinematicHero
      eyebrow={page.eyebrow}
      heading={page.heading}
      description={page.heroDescription}
      media={pageMedia[page.mediaKey]}
      contentWidth="wide"
    />
  );
}
