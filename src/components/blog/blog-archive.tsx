import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { stripIssueReferences } from "@/lib/thrive-weekly";
import type { BlogCategory, BlogPostSummary } from "@/sanity/lib/types";

const archiveAnchorId = "thrive-weekly-archive";

type BlogArchiveProps = {
  posts: BlogPostSummary[];
  categories: BlogCategory[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasSanityConfig: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function createArchiveHref(page: number) {
  const pathname = page <= 1 ? "/thrive-weekly" : `/thrive-weekly?page=${page}`;
  return `${pathname}#${archiveAnchorId}`;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

export function BlogArchive({
  posts,
  categories,
  currentPage,
  totalPages,
  hasSanityConfig,
}: BlogArchiveProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <section
      id={archiveAnchorId}
      className="relative z-10 overflow-hidden pb-24 pt-14 text-foreground scroll-mt-32 sm:pb-28 sm:pt-16"
    >
      <Container>
        <div className="relative">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <p className="ocean-readable text-base font-medium leading-8 text-muted-light sm:text-lg">
                <strong>
                  Welcome to Thrive Weekly — a soulful space where wellness meets real
                  life, grounded in faith and guided by purpose.
                </strong>
              </p>
              <p className="ocean-readable mt-5 text-base font-medium leading-8 text-muted-light sm:text-lg">
                <strong>
                  I&apos;m Christine Fran&#231;ois, a wellness coach, fitness advocate, and
                  brain health educator. My faith in God is the foundation of all I do,
                  and I view this work as my ministry. Here, you&apos;ll find authentic
                  conversations that inspire holistic health, brain wellness, and vibrant
                  living; all rooted in the rhythm, resilience, and beauty of Caribbean
                  culture.
                </strong>
              </p>
            </div>

            {!hasSanityConfig ? (
              <div className="rounded-[1.5rem] border border-white/12 bg-white/[0.06] px-5 py-4 text-sm leading-7 text-muted-light backdrop-blur-sm">
                Sanity environment variables are not configured in this workspace yet, so the
                archive will populate as soon as the connected project credentials are added.
              </div>
            ) : null}
          </div>

          {categories.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {categories.map((category) => (
                <span
                  key={category._id}
                  className="rounded-full border border-white/14 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-light"
                >
                  {category.title}
                </span>
              ))}
            </div>
          ) : null}

          {posts.length ? (
            <>
              <div className="mt-10 grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => {
                  const safeExcerpt = stripIssueReferences(post.excerpt);

                  return (
                    <article
                      key={post._id}
                      className="ocean-card-glow flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-white/14 bg-white/[0.08] backdrop-blur-sm transition hover:border-accent-cyan/45"
                    >
                      <Link
                        href={`/thrive-weekly/${post.slug}`}
                        className="group flex h-full flex-col"
                        title={post.title}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.05]">
                          {post.mainImage?.asset?.url ? (
                            <Image
                              src={post.mainImage.asset.url}
                              alt={post.mainImage.alt || ""}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-[1.03]"
                              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(54,211,242,0.14),rgba(7,25,43,0.16),rgba(255,214,77,0.12))]" />
                          )}
                          <div
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,25,43,0.02)_0%,rgba(7,25,43,0.18)_100%)]"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="flex flex-1 flex-col p-6">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-cyan">
                            {formatDate(post.publishedAt)}
                          </p>
                          <h3 className="font-display mt-3 line-clamp-2 text-2xl font-normal leading-tight text-white">
                            {post.title}
                          </h3>
                          {safeExcerpt ? (
                            <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-light sm:text-base">
                              {safeExcerpt}
                            </p>
                          ) : null}

                          {post.categories.length ? (
                            <div className="mt-5 flex flex-wrap gap-2">
                              {post.categories.map((category) => (
                                <span
                                  key={category._id}
                                  className="rounded-full border border-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72"
                                >
                                  {category.title}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-auto pt-6">
                            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition group-hover:border-accent-yellow/70 group-hover:text-accent-yellow">
                              Read article
                              <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/12 bg-white/[0.05] px-4 py-4 backdrop-blur-sm sm:px-5"
                  aria-label="Thrive Weekly pagination"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {currentPage > 1 ? (
                      <Link
                        href={createArchiveHref(currentPage - 1)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-accent-yellow/70 hover:text-accent-yellow"
                      >
                        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                        Previous
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
                        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                        Previous
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {visiblePages.map((page, index) => {
                        const previousPage = visiblePages[index - 1];
                        const showEllipsis = previousPage && page - previousPage > 1;

                        return (
                          <div key={page} className="flex items-center gap-2">
                            {showEllipsis ? (
                              <span className="px-1 text-sm text-white/48" aria-hidden="true">
                                ...
                              </span>
                            ) : null}
                            {page === currentPage ? (
                              <span
                                aria-current="page"
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink"
                              >
                                {page}
                              </span>
                            ) : (
                              <Link
                                href={createArchiveHref(page)}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-accent-cyan/60 hover:text-accent-cyan"
                              >
                                {page}
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-light">
                      Page {currentPage} of {totalPages}
                    </p>
                    {currentPage < totalPages ? (
                      <Link
                        href={createArchiveHref(currentPage + 1)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-accent-yellow/70 hover:text-accent-yellow"
                      >
                        Next
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
                        Next
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mt-10 rounded-[1.5rem] border border-dashed border-white/18 bg-white/[0.05] p-7 text-base leading-7 text-muted-light backdrop-blur-sm">
              No Sanity blog posts are available yet in the current environment.
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
