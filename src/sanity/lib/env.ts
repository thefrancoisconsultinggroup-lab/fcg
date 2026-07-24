export const sanityApiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-07-17";
export const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
export const sanityReadToken = process.env.SANITY_API_READ_TOKEN || "";

export const hasSanityReadConfig = Boolean(sanityProjectId && sanityDataset);
