import {sanityFetch} from "@/sanity/lib/client";
import {
  blogArchiveCountQuery,
  blogArchivePageQuery,
  blogArchiveQuery,
  blogCategoryQuery,
  blogPostBySlugQuery,
  blogPostSlugsQuery,
  relatedBlogPostsQuery,
} from "@/sanity/lib/queries";
import type {BlogCategory, BlogPost, BlogPostSummary} from "@/sanity/lib/types";

export async function getBlogArchivePosts() {
  return sanityFetch<BlogPostSummary[]>({
    query: blogArchiveQuery,
    fallback: [],
  });
}

export async function getBlogArchivePostCount() {
  return sanityFetch<number>({
    query: blogArchiveCountQuery,
    fallback: 0,
  });
}

export async function getBlogArchivePage(start: number, end: number) {
  return sanityFetch<BlogPostSummary[]>({
    query: blogArchivePageQuery,
    params: {start, end},
    fallback: [],
  });
}

export async function getBlogCategories() {
  return sanityFetch<BlogCategory[]>({
    query: blogCategoryQuery,
    fallback: [],
  });
}

export async function getBlogPostSlugs() {
  return sanityFetch<string[]>({
    query: blogPostSlugsQuery,
    fallback: [],
  });
}

export async function getBlogPostBySlug(slug: string) {
  return sanityFetch<BlogPost | null>({
    query: blogPostBySlugQuery,
    params: {slug},
    fallback: null,
  });
}

export async function getRelatedBlogPosts(slug: string) {
  return sanityFetch<BlogPostSummary[]>({
    query: relatedBlogPostsQuery,
    params: {slug},
    fallback: [],
  });
}
