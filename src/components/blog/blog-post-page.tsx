import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowRight} from "lucide-react";
import {BlogPortableText} from "@/components/blog/blog-portable-text";
import {Container} from "@/components/ui/container";
import {summitRoute} from "@/data/human-capacity-summit";
import type {BlogPost, BlogPostSummary} from "@/sanity/lib/types";

type BlogPostPageProps = {
  post: BlogPost | null;
  relatedPosts: BlogPostSummary[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogPostPage({post, relatedPosts}: BlogPostPageProps) {
  if (!post) {
    notFound();
  }

  return (
    <article className="relative overflow-hidden pb-24 pt-32 text-foreground sm:pt-36">
      <Container>
        <header className="max-w-5xl">
          <Link
            href="/thrive-weekly"
            className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-cyan transition hover:text-accent-yellow"
          >
            Thrive Weekly
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan">
            <span>{formatDate(post.publishedAt)}</span>
            {post.categories.map((category) => (
              <span key={category._id}>{category.title}</span>
            ))}
          </div>
          <h1 className="font-display mt-6 text-4xl font-normal leading-[0.94] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
            {post.title}
          </h1>
          {post.author?.name ? (
            <p className="mt-6 text-sm uppercase tracking-[0.18em] text-white/66">
              By {post.author.name}
            </p>
          ) : null}
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,0.74fr)_minmax(18rem,0.26fr)] xl:gap-16">
          <div className="min-w-0">
            {post.mainImage?.asset?.url ? (
              <figure className="mb-14 overflow-hidden rounded-[1.35rem] border border-white/12 bg-white/[0.04] p-3">
                <Image
                  src={post.mainImage.asset.url}
                  alt={post.mainImage.alt || ""}
                  width={post.mainImage.asset.metadata?.dimensions?.width || 1600}
                  height={post.mainImage.asset.metadata?.dimensions?.height || 1000}
                  className="w-full rounded-[1rem] object-cover"
                  sizes="(min-width: 1280px) 820px, (min-width: 1024px) 70vw, 100vw"
                  priority
                />
                {post.mainImage.caption ? (
                  <figcaption className="px-3 pt-4 text-sm leading-6 text-muted-light">
                    {post.mainImage.caption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}
            <BlogPortableText value={post.body} />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.25rem] border border-white/12 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-cyan">
                  More from Thrive Weekly
                </h2>
                <Link
                  href="/thrive-weekly"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-yellow transition hover:text-accent-cyan"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost._id}
                    href={`/thrive-weekly/${relatedPost.slug}`}
                    className="group grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 rounded-md p-1 transition hover:bg-white/[0.05]"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md bg-white/[0.06]">
                      {relatedPost.mainImage?.asset?.url ? (
                        <Image
                          src={relatedPost.mainImage.asset.url}
                          alt={relatedPost.mainImage.alt || ""}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.04]"
                          sizes="76px"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/52">
                        {formatDate(relatedPost.publishedAt)}
                      </p>
                      <h3 className="mt-1 line-clamp-3 text-sm font-semibold leading-5 text-white transition group-hover:text-accent-yellow">
                        {relatedPost.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {post.author?.bio ? (
              <div className="rounded-[1.25rem] border border-white/12 bg-white/[0.05] p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent-cyan">
                  Author
                </p>
                <h2 className="font-display mt-4 text-2xl text-white">{post.author.name}</h2>
                <p className="mt-4 text-sm leading-7 text-muted-light">{post.author.bio}</p>
              </div>
            ) : null}

            <Link
              href={summitRoute}
              className="group block overflow-hidden rounded-[1.25rem] border border-accent-yellow/34 bg-[linear-gradient(145deg,rgba(255,214,77,0.16),rgba(54,211,242,0.08),rgba(255,255,255,0.05))] p-5 backdrop-blur-sm transition hover:border-accent-yellow/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-yellow">
                Human Capacity Summit
              </p>
              <h2 className="font-display mt-4 text-2xl leading-tight text-white">
                Expanding what people and organisations can become
              </h2>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition group-hover:text-accent-yellow">
                Explore the Summit
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
          </aside>
        </div>
      </Container>
    </article>
  );
}
