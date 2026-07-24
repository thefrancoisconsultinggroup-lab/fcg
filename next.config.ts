import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

type BlogAuditPost = {
  slug: string;
};

function loadLegacyBlogSlugs() {
  const reportPath = path.join(process.cwd(), "migration", "blog", "source-posts.json");
  const fallbackPath = path.join(process.cwd(), "migration", "blog-audit.json");
  const sourcePath = fs.existsSync(reportPath) ? reportPath : fallbackPath;

  if (!fs.existsSync(sourcePath)) {
    return [];
  }

  const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as
    | { posts?: BlogAuditPost[] }
    | BlogAuditPost[];
  const posts = Array.isArray(raw) ? raw : raw.posts || [];

  return posts
    .map((post) => post.slug)
    .filter(Boolean)
    .map((slug) => ({
      source: `/${slug}`,
      destination: `/thrive-weekly/${slug}`,
      permanent: true,
    }));
}

const legacyBlogRedirects = loadLegacyBlogSlugs();

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
      {
        pathname: "/assets/summit/**",
        search: "?v=20260724",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/about",
        destination: "/about-us",
        permanent: true,
      },
      {
        source: "/leadership-wellness",
        destination: "/programs-services",
        permanent: true,
      },
      {
        source: "/home-2",
        destination: "/",
        permanent: true,
      },
      ...legacyBlogRedirects,
    ];
  },
};

export default nextConfig;
