import {createClient, type QueryParams} from "next-sanity";
import {
  hasSanityReadConfig,
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
  sanityReadToken,
} from "@/sanity/lib/env";

const client = hasSanityReadConfig
  ? createClient({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      apiVersion: sanityApiVersion,
      useCdn: true,
      perspective: "published",
      stega: false,
      token: sanityReadToken || undefined,
    })
  : null;

type SanityFetchOptions<T> = {
  query: string;
  params?: QueryParams;
  fallback: T;
};

export async function sanityFetch<T>({
  query,
  params,
  fallback,
}: SanityFetchOptions<T>): Promise<T> {
  if (!client) {
    return fallback;
  }

  if (params) {
    return client.fetch<T>(query, params);
  }

  return client.fetch<T>(query);
}
