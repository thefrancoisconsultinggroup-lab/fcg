import type {Metadata} from "next";
import {BlogPostPage} from "@/components/blog/blog-post-page";
import {stripIssueReferences} from "@/lib/thrive-weekly";
import {getBlogPostBySlug, getBlogPostSlugs, getRelatedBlogPosts} from "@/sanity/lib/api";

export async function generateStaticParams() {
  const slugs = await getBlogPostSlugs();
  return slugs.map((slug) => ({slug}));
}

export async function generateMetadata(
  props: PageProps<"/thrive-weekly/[slug]">,
): Promise<Metadata> {
  const {slug} = await props.params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Thrive Weekly",
    };
  }

  const safeTitle = stripIssueReferences(post.seoTitle || post.title) || "Thrive Weekly";
  const description = stripIssueReferences(post.seoDescription || post.excerpt || "") || "";

  return {
    title: safeTitle,
    description,
    alternates: {
      canonical: `/thrive-weekly/${post.slug}`,
    },
    openGraph: {
      title: safeTitle,
      description,
      type: "article",
      url: `/thrive-weekly/${post.slug}`,
      publishedTime: post.publishedAt,
    },
  };
}

export default async function ThriveWeeklyPostPage(props: PageProps<"/thrive-weekly/[slug]">) {
  const {slug} = await props.params;
  const [post, relatedPosts] = await Promise.all([
    getBlogPostBySlug(slug),
    getRelatedBlogPosts(slug),
  ]);

  return <BlogPostPage post={post} relatedPosts={relatedPosts} />;
}
