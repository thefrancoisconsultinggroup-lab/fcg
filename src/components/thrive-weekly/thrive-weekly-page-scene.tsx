"use client";

import { BlogArchive } from "@/components/blog/blog-archive";
import type { BlogCategory, BlogPostSummary } from "@/sanity/lib/types";
import { ThriveWeeklyHero } from "@/components/thrive-weekly/thrive-weekly-hero";

type ThriveWeeklyPageSceneProps = {
  posts: BlogPostSummary[];
  categories: BlogCategory[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasSanityConfig: boolean;
};

export function ThriveWeeklyPageScene({
  posts,
  categories,
  currentPage,
  totalPages,
  totalPosts,
  hasSanityConfig,
}: ThriveWeeklyPageSceneProps) {
  return (
    <div className="relative overflow-x-clip">
      <ThriveWeeklyHero targetId="thrive-weekly-body" />
      <div id="thrive-weekly-body" className="relative z-10 overflow-hidden">
        <BlogArchive
          posts={posts}
          categories={categories}
          currentPage={currentPage}
          totalPages={totalPages}
          totalPosts={totalPosts}
          hasSanityConfig={hasSanityConfig}
        />
      </div>
    </div>
  );
}
