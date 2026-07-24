import type { Metadata } from "next";
import type { SitePage } from "@/data/pages";

const siteName = "Francois Consulting Group";

export function pageMetadata(page: SitePage): Metadata {
  return {
    title: page.metadataTitleAbsolute ? { absolute: page.metadataTitle } : page.metadataTitle,
    description: page.metadataDescription,
    alternates: {
      canonical: page.route,
    },
    openGraph: {
      title: page.metadataTitleAbsolute ? page.metadataTitle : `${page.metadataTitle} | ${siteName}`,
      description: page.metadataDescription,
      url: page.route,
      siteName,
      type: "website",
      images: page.metadataImage ? [{ url: page.metadataImage }] : undefined,
    },
  };
}
