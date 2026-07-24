"use client";

import Image from "next/image";
import type {CSSProperties} from "react";
import {PortableText, type PortableTextComponents} from "@portabletext/react";
import type {BlogPost, PortableBodyNode} from "@/sanity/lib/types";

type BlogPortableTextProps = {
  value: BlogPost["body"];
};

type BlogImageAlignment = "left" | "center" | "right" | "none" | "full";
type BlogImageSize = "small" | "medium" | "large" | "full";
type BlogImageLayout =
  | "floatLeft"
  | "floatRight"
  | "mediaTextLeft"
  | "mediaTextRight"
  | "center"
  | "block"
  | "full";

function resolveImageWidth(size: BlogImageSize, displayWidth?: number, originalWidth?: number) {
  if (size === "full") {
    return null;
  }

  if (typeof displayWidth === "number" && Number.isFinite(displayWidth) && displayWidth > 0) {
    return displayWidth;
  }

  if (typeof originalWidth === "number" && Number.isFinite(originalWidth) && originalWidth > 0) {
    return originalWidth;
  }

  switch (size) {
    case "small":
      return 280;
    case "medium":
      return 420;
    case "large":
      return 760;
    default:
      return 420;
  }
}

function getImageFigureClass(
  layout: BlogImageLayout,
  alignment: BlogImageAlignment,
  size: BlogImageSize,
) {
  if (layout === "floatLeft" || layout === "mediaTextLeft") {
    return "blog-rich-text__figure blog-rich-text__figure--left clear-none mx-auto md:float-left md:mr-8 md:mb-5 md:ml-0 md:mt-1";
  }

  if (layout === "floatRight" || layout === "mediaTextRight") {
    return "blog-rich-text__figure blog-rich-text__figure--right clear-none mx-auto md:float-right md:ml-8 md:mb-5 md:mr-0 md:mt-1";
  }

  if (layout === "full" || size === "full" || alignment === "full") {
    return "blog-rich-text__figure blog-rich-text__figure--full w-full clear-both";
  }

  if (layout === "block") {
    return "blog-rich-text__figure blog-rich-text__figure--block clear-both";
  }

  if (alignment === "left") {
    return "blog-rich-text__figure blog-rich-text__figure--block mr-auto ml-0 clear-both";
  }

  if (alignment === "right") {
    return "blog-rich-text__figure blog-rich-text__figure--block ml-auto mr-0 clear-both";
  }

  return "blog-rich-text__figure blog-rich-text__figure--center mx-auto clear-both";
}

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
  } catch {
    return null;
  }

  return null;
}

const components: PortableTextComponents = {
  block: {
    normal: ({children}) => (
      <p className="ocean-readable text-lg leading-8 text-muted-light">{children}</p>
    ),
    h2: ({children}) => (
      <h2 className="pt-6 font-display text-3xl font-normal leading-tight text-white sm:text-4xl">
        {children}
      </h2>
    ),
    h3: ({children}) => (
      <h3 className="pt-4 font-display text-2xl font-normal leading-tight text-white sm:text-3xl">
        {children}
      </h3>
    ),
    blockquote: ({children}) => (
      <blockquote className="border-l border-accent-cyan/40 pl-5 font-medium italic text-white/88">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({children}) => (
      <ul className="list-outside list-disc space-y-3 pl-7 text-lg leading-8 text-muted-light marker:text-accent-cyan">
        {children}
      </ul>
    ),
    number: ({children}) => (
      <ol className="list-outside list-decimal space-y-3 pl-7 text-lg leading-8 text-muted-light marker:text-accent-cyan">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({children}) => <li className="pl-1">{children}</li>,
    number: ({children}) => <li className="pl-1">{children}</li>,
  },
  marks: {
    em: ({children}) => <em>{children}</em>,
    strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
    link: ({children, value}) => {
      const href = typeof value?.href === "string" ? value.href : "#";
      const isExternal = /^https?:\/\//.test(href);

      return (
        <a
          href={href}
          className="text-accent-cyan underline decoration-accent-cyan/50 underline-offset-4 transition hover:text-accent-yellow"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({value}) => {
      const imageValue = value as PortableBodyNode & {
        asset?: {
          url?: string;
          metadata?: {
            dimensions?: {
              width: number;
              height: number;
            };
          };
        };
        layout?: BlogImageLayout;
        alignment?: BlogImageAlignment;
        size?: BlogImageSize;
        displayWidth?: number;
        displayHeight?: number;
        aspectRatio?: number;
        originalWidth?: number;
        alt?: string;
        caption?: string;
      };
      const src = imageValue.asset?.url;
      const width = imageValue.asset?.metadata?.dimensions?.width || 1200;
      const height = imageValue.asset?.metadata?.dimensions?.height || 900;
      const alignment = imageValue.alignment || "center";
      const size = imageValue.size || "medium";
      const layout =
        imageValue.layout ||
        (alignment === "left"
          ? "floatLeft"
          : alignment === "right"
            ? "floatRight"
            : alignment === "full"
              ? "full"
              : "center");
      const isMediaTextLayout = layout === "mediaTextLeft" || layout === "mediaTextRight";
      const resolvedWidth = isMediaTextLayout
        ? imageValue.displayWidth || imageValue.originalWidth || null
        : resolveImageWidth(size, imageValue.displayWidth, imageValue.originalWidth);
      const figureStyle = {
        "--blog-image-width": resolvedWidth ? `${resolvedWidth}px` : "100%",
        "--blog-image-height": imageValue.displayHeight
          ? `${imageValue.displayHeight}px`
          : "auto",
        width: resolvedWidth ? `min(100%, ${resolvedWidth}px)` : "100%",
        maxWidth: "100%",
      } as CSSProperties;
      if (!src) {
        return null;
      }

      return (
        <figure
          className={`${getImageFigureClass(layout, alignment, size)} mb-5`}
          data-blog-layout={layout}
          style={figureStyle}
        >
          <Image
            src={src}
            alt={imageValue.alt || ""}
            width={width}
            height={height}
            className="h-auto w-full rounded-[1rem] object-contain"
            sizes={
              resolvedWidth
                ? `(min-width: 1024px) ${resolvedWidth}px, (min-width: 768px) min(48vw, ${resolvedWidth}px), min(100vw - 2rem, ${resolvedWidth}px)`
                : "(min-width: 1280px) 820px, (min-width: 1024px) 700px, 100vw"
            }
            loading="lazy"
          />
          {imageValue.caption ? (
            <figcaption className="pt-3 text-sm leading-6 text-muted-light">
              {imageValue.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    },
    layoutBreak: ({value}) => {
      const breakValue = value as PortableBodyNode & {kind?: "clearBoth"};
      if (breakValue.kind === "clearBoth") {
        return <div className="clear-both h-0" aria-hidden="true" />;
      }

      return null;
    },
    externalEmbed: ({value}) => {
      const embedValue = value as PortableBodyNode & {url?: string; title?: string};
      const url = typeof embedValue.url === "string" ? embedValue.url : "";
      if (!url) {
        return null;
      }

      const youTubeUrl = getYouTubeEmbedUrl(url);

      if (youTubeUrl) {
        return (
          <div className="clear-both overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.04] p-3">
            <div className="aspect-video overflow-hidden rounded-[1.1rem]">
              <iframe
                src={youTubeUrl}
                title={embedValue.title || "Embedded media"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        );
      }

      return (
        <p className="text-lg leading-8 text-muted-light">
          Embedded media:{" "}
          <a
            href={url}
            className="text-accent-cyan underline decoration-accent-cyan/50 underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            {embedValue.title || url}
          </a>
        </p>
      );
    },
  },
};

export function BlogPortableText({value}: BlogPortableTextProps) {
  return (
    <div className="blog-rich-text after:block after:clear-both after:content-['']">
      <PortableText value={value} components={components} />
    </div>
  );
}
