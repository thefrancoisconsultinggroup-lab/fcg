import { ThriveWeeklyPageScene } from "@/components/thrive-weekly/thrive-weekly-page-scene";
import { redirect } from "next/navigation";
import { sitePages } from "@/data/pages";
import { pageMetadata } from "@/lib/metadata";
import {
  getBlogArchivePage,
  getBlogArchivePostCount,
  getBlogCategories,
} from "@/sanity/lib/api";
import { hasSanityReadConfig } from "@/sanity/lib/env";

const page = sitePages.thriveWeekly;
const postsPerPage = 12;

export const metadata = pageMetadata(page);

function createPageHref(pageNumber: number) {
  return pageNumber <= 1 ? "/thrive-weekly" : `/thrive-weekly?page=${pageNumber}`;
}

function readPageParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) {
    return { rawValue, page: 1, isValid: true };
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return { rawValue, page: 1, isValid: false };
  }

  return { rawValue, page: parsed, isValid: true };
}

export default async function ThriveWeeklyPage(props: PageProps<"/thrive-weekly">) {
  const searchParams = await props.searchParams;
  const requestedPage = readPageParam(searchParams.page);
  if (!requestedPage.isValid) {
    redirect(createPageHref(1));
  }

  const [totalPosts, categories] = await Promise.all([
    getBlogArchivePostCount(),
    getBlogCategories(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalPosts / postsPerPage));
  const currentPage = Math.min(requestedPage.page, totalPages);

  if (requestedPage.page > totalPages || requestedPage.rawValue === "1") {
    redirect(createPageHref(currentPage));
  }

  const start = (currentPage - 1) * postsPerPage;
  const posts = await getBlogArchivePage(start, start + postsPerPage);

  return (
    <ThriveWeeklyPageScene
      posts={posts}
      categories={categories}
      currentPage={currentPage}
      totalPages={totalPages}
      totalPosts={totalPosts}
      hasSanityConfig={hasSanityReadConfig}
    />
  );
}
