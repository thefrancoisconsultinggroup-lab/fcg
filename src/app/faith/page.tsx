import { FaithPageScene } from "@/components/faith/faith-page-scene";
import { faithPageContent } from "@/data/pages/faith";
import { sitePages } from "@/data/pages";
import type { ContentImage } from "@/data/pages/types";
import { pageMetadata } from "@/lib/metadata";

const page = sitePages.faith;

export const metadata = pageMetadata(page);

export default function FaithPage() {
  const quoteSection = faithPageContent.sections[0];
  const quoteImages =
    quoteSection.cards?.map((card) => card.image).filter((image): image is ContentImage => Boolean(image)) ?? [];

  return (
    <>
      <FaithPageScene
        heading={quoteSection.heading}
        quotes={quoteImages}
      />
    </>
  );
}
