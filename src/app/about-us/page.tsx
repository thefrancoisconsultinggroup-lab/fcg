import { AboutPageScene } from "@/components/about/about-page-scene";
import { sitePages } from "@/data/pages";
import { pageMetadata } from "@/lib/metadata";

const page = sitePages.aboutUs;

export const metadata = pageMetadata(page);

export default function AboutUsPage() {
  return (
    <>
      <AboutPageScene />
    </>
  );
}
