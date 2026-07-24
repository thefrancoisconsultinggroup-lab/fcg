import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {createClient} from "@sanity/client";
import * as cheerio from "cheerio";
import type {AnyNode} from "domhandler";

const WORDPRESS_BASE_URL = "https://francoisconsultinggroup.com";
const WORDPRESS_API_BASE = `${WORDPRESS_BASE_URL}/wp-json/wp/v2`;
const BLOG_ARCHIVE_URL = `${WORDPRESS_BASE_URL}/thrive-weekly/`;
const API_USER_AGENT = "FrancoisConsultingGroupMigration/1.0";
const TEMPLATE_IMAGE_PATTERNS = [
  /Footer-Thrive-Weekly/i,
  /\/image\.png$/i,
  /christine-d-francois-sign-off/i,
];

export type WpRenderedField = {
  rendered: string;
};

export type WpPost = {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: WpRenderedField;
  content: WpRenderedField & {protected: boolean};
  excerpt: WpRenderedField & {protected: boolean};
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  class_list?: string[];
  meta?: Record<string, unknown>;
  _embedded?: {
    author?: WpUser[];
    "wp:featuredmedia"?: WpMedia[];
    "wp:term"?: [WpCategory[], WpTag[]];
  };
};

export type WpCategory = {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
};

export type WpTag = {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
};

export type WpUser = {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls?: Record<string, string>;
};

export type WpMedia = {
  id: number;
  slug: string;
  link: string;
  source_url: string;
  alt_text: string;
  caption: WpRenderedField;
  title: WpRenderedField;
  mime_type: string;
  media_details?: {
    width?: number;
    height?: number;
    file?: string;
    sizes?: Record<
      string,
      {
        width?: number;
        height?: number;
        source_url?: string;
      }
    >;
  };
};

export type PortableTextSpan = {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
};

export type PortableTextMarkDef = {
  _key: string;
  _type: "link";
  href: string;
};

export type PortableTextBlock = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: PortableTextMarkDef[];
  children: PortableTextSpan[];
  listItem?: "bullet" | "number";
  level?: number;
};

export type PortableTextImageBlock = {
  _type: "image";
  _key: string;
  layout?: "floatLeft" | "floatRight" | "mediaTextLeft" | "mediaTextRight" | "center" | "block" | "full";
  alignment?: "left" | "center" | "right" | "none" | "full";
  size?: "small" | "medium" | "large" | "full";
  displayWidth?: number;
  displayHeight?: number;
  aspectRatio?: number;
  originalWidth?: number;
  originalHeight?: number;
  wordpressClasses?: string[];
  alt?: string;
  caption?: string;
  originalUrl: string;
  asset?: {
    _type: "reference";
    _ref: string;
  };
};

export type PortableTextEmbedBlock = {
  _type: "externalEmbed";
  _key: string;
  url: string;
  provider?: string;
  title?: string;
};

export type PortableTextLayoutBreak = {
  _type: "layoutBreak";
  _key: string;
  kind: "clearBoth";
};

export type PortableTextNode =
  | PortableTextBlock
  | PortableTextImageBlock
  | PortableTextLayoutBreak
  | PortableTextEmbedBlock;

export type SourcePostRecord = {
  wordpressId: number;
  title: string;
  slug: string;
  productionUrl: string;
  newUrl: string;
  date: string;
  modified: string;
  authorId: number;
  authorSlug: string;
  categoryIds: number[];
  categorySlugs: string[];
  tagIds: number[];
  featuredMediaId: number | null;
  featuredImageUrl: string | null;
  inlineMediaUrls: string[];
  excerpt: string;
  unusualEmbeds: string[];
  selectionReasons: string[];
};

export type MigrationOptions = {
  dryRun: boolean;
  projectId?: string;
  dataset?: string;
  apiVersion: string;
  writeToken?: string;
};

type ImageAlignment = "left" | "center" | "right" | "none" | "full";
type ImageSize = "small" | "medium" | "large" | "full";

type ImagePresentation = {
  layout: "floatLeft" | "floatRight" | "mediaTextLeft" | "mediaTextRight" | "center" | "block" | "full";
  alignment: ImageAlignment;
  size: ImageSize;
  displayWidth?: number;
  displayHeight?: number;
  aspectRatio?: number;
  originalWidth?: number;
  originalHeight?: number;
  classes: string[];
};

type AssetRecord = {
  sourceUrl: string;
  mediaId?: number;
  postSlug?: string;
  alt?: string;
  caption?: string;
  title?: string;
  mimeType?: string;
  filename: string;
  presentation?: ImagePresentation;
};

type MigrationState = {
  dryRun: boolean;
  selectedPosts: SourcePostRecord[];
  brokenLinks: string[];
  bodyWarnings: string[];
  unresolvedRemoteMedia: string[];
  featuredImagesUploaded: number;
  inlineImagesUploaded: number;
  duplicateAssetsReused: number;
  failedAssetDownloads: string[];
  migrationErrors: string[];
  postsImported: number;
  postsSkipped: number;
  authorsUpserted: number;
  categoriesUpserted: number;
  tagsUpserted: number;
  imageAlignmentCounts: Record<ImageAlignment, number>;
  imageSizeCounts: Record<ImageSize, number>;
  sampleImagePresentations: Array<{
    postSlug: string;
    sourceUrl: string;
    layout: "floatLeft" | "floatRight" | "mediaTextLeft" | "mediaTextRight" | "center" | "block" | "full";
    alignment: ImageAlignment;
    size: ImageSize;
    displayWidth?: number;
    displayHeight?: number;
    originalWidth?: number;
    originalHeight?: number;
    caption?: string;
    classes: string[];
  }>;
};

type SanityDocument = {
  _id: string;
  _type: string;
  [key: string]: unknown;
};

type TransformContext = {
  assetResolver: (record: AssetRecord, kind: "featured" | "inline") => Promise<PortableTextImageBlock>;
  linkResolver: (href: string, sourceSlug: string) => string;
  fetchMediaById: (mediaId: number) => Promise<WpMedia | null>;
  state: MigrationState;
  post: WpPost;
};

const RELEVANT_CATEGORY_SLUGS = new Set([
  "brain-health",
  "leadership",
  "lifestyle",
  "wellness-at-work",
  "womens-health",
]);

const KNOWN_PAGE_ROUTE_MAP = new Map<string, string>([
  ["/", "/"],
  ["/home-2", "/"],
  ["/about", "/about-us"],
  ["/about-us", "/about-us"],
  ["/faith", "/faith"],
  ["/programs-services", "/programs-services"],
  ["/leadership-wellness", "/programs-services"],
  ["/integrated-leadership-and-corporate-wellness-team", "/integrated-leadership-and-corporate-wellness-team"],
  ["/neumi-wellness", "/neumi-wellness"],
  ["/thrive-weekly", "/thrive-weekly"],
  ["/contact", "/contact"],
]);

function stableKey(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 12);
}

function uniquifyKey(key: string | undefined, seed: string, duplicateIndex: number) {
  return duplicateIndex === 0 && key ? key : stableKey(`${seed}:${key || "missing"}:${duplicateIndex}`);
}

function ensureUniquePortableTextKeys(body: PortableTextNode[], seed: string) {
  const bodyKeyCounts = new Map<string, number>();

  return body.map((node, index) => {
    const originalKey = node._key || stableKey(`${seed}:node:${index}`);
    const duplicateIndex = bodyKeyCounts.get(originalKey) || 0;
    bodyKeyCounts.set(originalKey, duplicateIndex + 1);

    const nextNode = {
      ...node,
      _key: uniquifyKey(originalKey, `${seed}:body:${index}`, duplicateIndex),
    } as PortableTextNode;

    if (nextNode._type === "block") {
      const childKeyCounts = new Map<string, number>();
      nextNode.children = nextNode.children.map((child, childIndex) => {
        const childKey = child._key || stableKey(`${seed}:child:${index}:${childIndex}`);
        const childDuplicateIndex = childKeyCounts.get(childKey) || 0;
        childKeyCounts.set(childKey, childDuplicateIndex + 1);

        return {
          ...child,
          _key: uniquifyKey(
            childKey,
            `${seed}:child:${index}:${childIndex}`,
            childDuplicateIndex,
          ),
        };
      });
    }

    return nextNode;
  });
}

function repairText(value: string) {
  return value
    .replace(/â€™/g, "’")
    .replace(/â€˜/g, "‘")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/â€¦/g, "…")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ã§/g, "ç")
    .replace(/Ã±/g, "ñ")
    .replace(/Â /g, " ")
    .replace(/\u00a0/g, " ");
}

function decodeHtml(value: string) {
  return cheerio.load(value).text();
}

function cleanRenderedText(value: string) {
  return repairText(decodeHtml(value)).replace(/\s{2,}/g, " ").trim();
}

function toIsoFromGmt(value: string) {
  return value ? new Date(`${value}Z`).toISOString() : new Date().toISOString();
}

function textFromHtml(html: string) {
  const $ = cheerio.load(html);
  return repairText($.text())
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(html: string) {
  return textFromHtml(html).replace(/\s{2,}/g, " ").trim();
}

function makeSpan(text: string, marks: string[]) {
  return {
    _type: "span" as const,
    _key: stableKey(`span:${marks.join(".")}:${text}`),
    text,
    marks,
  };
}

function normalizePathname(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return clean;
}

function shouldDropTemplateImage(url: string) {
  return TEMPLATE_IMAGE_PATTERNS.some((pattern) => pattern.test(url));
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": API_USER_AGENT,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as T;
  return {json, headers: response.headers};
}

async function fetchPaginated<T>(endpoint: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams({...params, per_page: "100", page: "1"});
  const firstUrl = `${WORDPRESS_API_BASE}/${endpoint}?${searchParams.toString()}`;
  const first = await fetchJson<T[]>(firstUrl);
  const total = Number(first.headers.get("X-WP-Total") || first.json.length);
  const totalPages = Number(first.headers.get("X-WP-TotalPages") || "1");
  const items = [...first.json];

  for (let page = 2; page <= totalPages; page += 1) {
    const pageParams = new URLSearchParams({...params, per_page: "100", page: String(page)});
    const nextUrl = `${WORDPRESS_API_BASE}/${endpoint}?${pageParams.toString()}`;
    const next = await fetchJson<T[]>(nextUrl);
    items.push(...next.json);
  }

  return {items, total, totalPages};
}

async function fetchWordPressSource() {
  const [rootIndex, types, postsResult, categoriesResult, tagsResult, usersResult] = await Promise.all([
    fetch(`${WORDPRESS_BASE_URL}/wp-json`, {headers: {"user-agent": API_USER_AGENT}}).then((response) =>
      response.json(),
    ),
    fetchJson<Record<string, {slug?: string; rest_base?: string}>>(`${WORDPRESS_API_BASE}/types`),
    fetchPaginated<WpPost>("posts", {_embed: "1"}),
    fetchPaginated<WpCategory>("categories"),
    fetchPaginated<WpTag>("tags"),
    fetchPaginated<WpUser>("users"),
  ]);

  const archiveHtml = await fetch(BLOG_ARCHIVE_URL, {
    headers: {"user-agent": API_USER_AGENT},
  }).then((response) => response.text());

  return {
    rootIndex,
    types: types.json,
    posts: postsResult.items,
    postsTotal: postsResult.total,
    postsTotalPages: postsResult.totalPages,
    categories: categoriesResult.items,
    tags: tagsResult.items,
    users: usersResult.items,
    archiveHtml,
  };
}

function extractWordPressImageId(value: string | undefined) {
  if (!value) return null;
  const match = value.match(/\bwp-image-(\d+)\b/);
  return match ? Number(match[1]) : null;
}

function detectEmbedProvider(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname === "youtu.be") {
      return "youtube";
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function parseDimensionValue(value: string | undefined) {
  if (!value) return undefined;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}

function parseWidthFromStyle(styleValue: string | undefined) {
  if (!styleValue) return undefined;
  const widthMatch = styleValue.match(/(?:^|;)\s*width\s*:\s*([^;]+)/i);
  if (!widthMatch) return undefined;
  return parseDimensionValue(widthMatch[1]);
}

function dedupeClasses(values: Array<string | undefined>) {
  return [...new Set(values.flatMap((value) => (value || "").split(/\s+/).filter(Boolean)))];
}

function mapSizeClassToSize(className: string, width?: number): ImageSize | null {
  if (/size-thumbnail/i.test(className)) return "small";
  if (/size-medium_large/i.test(className)) return "medium";
  if (/size-medium/i.test(className)) return width && width > 420 ? "medium" : "small";
  if (/size-large/i.test(className)) return "large";
  if (/size-full/i.test(className)) return "full";
  return null;
}

function inferImageSize(
  displayWidth: number | undefined,
  classes: string[],
  mediaWidth: number | undefined,
): ImageSize {
  const sizeFromClasses = classes
    .map((className) => mapSizeClassToSize(className, displayWidth))
    .find((value): value is ImageSize => Boolean(value));

  if (displayWidth) {
    if (displayWidth <= 320) return "small";
    if (displayWidth <= 560) return "medium";
    if (displayWidth <= 850) return "large";
    return "full";
  }

  if (sizeFromClasses) {
    return sizeFromClasses;
  }

  if (mediaWidth) {
    if (mediaWidth <= 320) return "small";
    if (mediaWidth <= 720) return "medium";
    if (mediaWidth <= 1200) return "large";
    return "full";
  }

  return "medium";
}

function inferImageAlignment(
  classes: string[],
  size: ImageSize,
  displayWidth: number | undefined,
): ImageAlignment {
  if (classes.some((className) => /\balignleft\b/i.test(className))) return "left";
  if (classes.some((className) => /\balignright\b/i.test(className))) return "right";
  if (classes.some((className) => /\baligncenter\b/i.test(className))) return "center";
  if (classes.some((className) => /\balignnone\b/i.test(className))) {
    return size === "full" ? "full" : "none";
  }
  if (size === "full" || (displayWidth && displayWidth >= 900)) {
    return "full";
  }
  return "center";
}

function inferImagePresentation(
  imageElement: cheerio.Cheerio<AnyNode>,
  media: WpMedia | null,
): ImagePresentation {
  const parent = imageElement.parent();
  const figure = imageElement.closest("figure");
  const wrapper = figure.length ? figure : parent;
  const classes = dedupeClasses([
    imageElement.attr("class"),
    parent.attr("class"),
    figure.attr("class"),
    wrapper.attr("class"),
  ]);

  const originalWidth =
    parseDimensionValue(imageElement.attr("width")) ||
    parseWidthFromStyle(imageElement.attr("style")) ||
    parseWidthFromStyle(figure.attr("style")) ||
    parseWidthFromStyle(wrapper.attr("style")) ||
    parseDimensionValue(imageElement.attr("data-width")) ||
    parseDimensionValue(imageElement.attr("data-orig-width")) ||
    undefined;
  const originalHeight =
    parseDimensionValue(imageElement.attr("height")) ||
    parseDimensionValue(imageElement.attr("data-height")) ||
    parseDimensionValue(imageElement.attr("data-orig-height")) ||
    undefined;
  const size = inferImageSize(originalWidth, classes, media?.media_details?.width);
  const alignment = inferImageAlignment(classes, size, originalWidth);
  const layout =
    alignment === "left"
      ? "floatLeft"
      : alignment === "right"
        ? "floatRight"
        : size === "full"
          ? "full"
          : "center";
  const aspectRatio =
    originalWidth && originalHeight && originalHeight > 0
      ? Number((originalWidth / originalHeight).toFixed(4))
      : media?.media_details?.width && media.media_details.height
        ? Number((media.media_details.width / media.media_details.height).toFixed(4))
        : undefined;

  return {
    layout,
    alignment: alignment === "center" && size === "full" ? "full" : alignment,
    size,
    displayWidth: originalWidth,
    displayHeight: originalHeight,
    aspectRatio,
    originalWidth,
    originalHeight,
    classes,
  };
}

function serializeInlineChildren(
  node: AnyNode,
  marks: string[],
  markDefs: PortableTextMarkDef[],
  linkResolver: (href: string) => string,
): PortableTextSpan[] {
  if (node.type === "text") {
    const text = repairText(node.data?.replace(/\u00a0/g, " ") || "");
    return text ? [makeSpan(text, marks)] : [];
  }

  if (node.type !== "tag") {
    return [];
  }

  if (node.tagName === "br") {
    return [makeSpan("\n", marks)];
  }

  const nextMarks = [...marks];
  if (node.tagName === "strong" || node.tagName === "b") {
    nextMarks.push("strong");
  }
  if (node.tagName === "em" || node.tagName === "i") {
    nextMarks.push("em");
  }
  if (node.tagName === "a") {
    const href = linkResolver(node.attribs?.href || "");
    const key = stableKey(`link:${href}`);
    if (!markDefs.find((definition) => definition._key === key)) {
      markDefs.push({_key: key, _type: "link", href});
    }
    nextMarks.push(key);
  }

  const children = node.children || [];
  return children.flatMap((child) =>
    serializeInlineChildren(child, nextMarks, markDefs, linkResolver),
  );
}

function collapseSpans(children: PortableTextSpan[]) {
  const collapsed: PortableTextSpan[] = [];

  for (const child of children) {
    const previous = collapsed[collapsed.length - 1];
    if (previous && previous.marks.join(",") === child.marks.join(",")) {
      previous.text += child.text;
      previous._key = stableKey(`span:${previous.marks.join(".")}:${previous.text}`);
      continue;
    }
    collapsed.push({...child});
  }

  return collapsed.filter((child) => child.text.length > 0);
}

function paragraphToBlock(
  element: cheerio.Cheerio<AnyNode>,
  style: string,
  linkResolver: (href: string) => string,
) {
  const markDefs: PortableTextMarkDef[] = [];
  const children = collapseSpans(
    element
      .contents()
      .toArray()
      .flatMap((node) => serializeInlineChildren(node, [], markDefs, linkResolver)),
  );

  if (!children.length || !children.some((child) => child.text.trim().length > 0)) {
    return null;
  }

  return {
    _type: "block" as const,
    _key: stableKey(`block:${style}:${children.map((child) => child.text).join("")}`),
    style,
    markDefs,
    children,
  };
}

function listItemToBlock(
  element: cheerio.Cheerio<AnyNode>,
  listItem: "bullet" | "number",
  linkResolver: (href: string) => string,
) {
  const markDefs: PortableTextMarkDef[] = [];
  const children = collapseSpans(
    element
      .contents()
      .toArray()
      .flatMap((node) => serializeInlineChildren(node, [], markDefs, linkResolver)),
  );

  if (!children.length || !children.some((child) => child.text.trim().length > 0)) {
    return null;
  }

  return {
    _type: "block" as const,
    _key: stableKey(`li:${listItem}:${children.map((child) => child.text).join("")}`),
    style: "normal",
    listItem,
    level: 1,
    markDefs,
    children,
  };
}

async function convertImageElement(
  imageElement: cheerio.Cheerio<AnyNode>,
  context: TransformContext,
  kind: "featured" | "inline",
  caption?: string,
  presentationOverrides?: Partial<ImagePresentation>,
) {
  const src = imageElement.attr("src");
  if (!src) {
    return null;
  }

  if (shouldDropTemplateImage(src)) {
    return null;
  }

  const mediaId = extractWordPressImageId(imageElement.attr("class"));
  const media = mediaId ? await context.fetchMediaById(mediaId) : null;

  const alt = media?.alt_text || imageElement.attr("alt") || undefined;
  const resolvedCaption = caption || stripHtml(media?.caption.rendered || "");
  const presentation = {
    ...inferImagePresentation(imageElement, media),
    ...presentationOverrides,
  };

  return context.assetResolver(
    {
      sourceUrl: media?.source_url || src,
      mediaId: media?.id || mediaId || undefined,
      postSlug: context.post.slug,
      alt,
      caption: resolvedCaption || undefined,
      title: stripHtml(media?.title.rendered || ""),
      mimeType: media?.mime_type,
      filename:
        media?.media_details?.file?.split("/").pop() ||
        media?.source_url.split("/").pop() ||
        src.split("/").pop() ||
        `image-${stableKey(src)}.bin`,
      presentation,
    },
    kind,
  );
}

async function convertNodes(
  nodes: AnyNode[],
  context: TransformContext,
): Promise<PortableTextNode[]> {
  const blocks: PortableTextNode[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      const text = node.data?.replace(/\u00a0/g, " ").trim() || "";
      if (!text) continue;
      blocks.push({
        _type: "block",
        _key: stableKey(`text:${text}`),
        style: "normal",
        markDefs: [],
        children: [makeSpan(text, [])],
      });
      continue;
    }

    if (node.type !== "tag") {
      continue;
    }

    const element = cheerio.load(node, null, false).root().children().first();
    const tagName = node.tagName.toLowerCase();
    const className = element.attr("class") || "";

    if (tagName === "script" || tagName === "style") {
      continue;
    }

    if (tagName === "figure") {
      const images = element.find("img").toArray();
      if (images.length) {
        const caption = images.length === 1 ? stripHtml(element.find("figcaption").html() || "") : "";
        for (const imageNode of images) {
          const imageBlock = await convertImageElement(
            cheerio.load(imageNode, null, false).root().children().first(),
            context,
            "inline",
            caption || undefined,
          );
          if (imageBlock) {
            blocks.push(imageBlock);
          }
        }
        continue;
      }

      const nestedBlocks = await convertNodes(element.contents().toArray(), context);
      blocks.push(...nestedBlocks);
      continue;
    }

    if (tagName === "picture") {
      const image = element.find("img").first();
      if (image.length) {
        const imageBlock = await convertImageElement(image, context, "inline");
        if (imageBlock) {
          blocks.push(imageBlock);
        }
      }
      continue;
    }

    if (tagName === "iframe") {
      const url = element.attr("src");
      if (url) {
        blocks.push({
          _type: "externalEmbed",
          _key: stableKey(`embed:${url}`),
          url,
          provider: detectEmbedProvider(url),
          title: element.attr("title") || undefined,
        });
      }
      continue;
    }

    if (tagName === "ul" || tagName === "ol") {
      const listItem = tagName === "ol" ? "number" : "bullet";
      const items = element.children("li").toArray();
      for (const item of items) {
        const itemBlock = listItemToBlock(
          cheerio.load(item, null, false).root().children().first(),
          listItem,
          (href) => context.linkResolver(href, context.post.slug),
        );
        if (itemBlock) {
          blocks.push(itemBlock);
        }
      }
      continue;
    }

    if (tagName === "div" && className.includes("wp-block-media-text")) {
      const floatsRight =
        className.includes("has-media-on-the-right") ||
        className.includes("has-media-on-right");
      const image = element.find("figure img").first();
      if (image.length) {
        const imageBlock = await convertImageElement(
          image,
          context,
          "inline",
          undefined,
          {
            alignment: floatsRight ? "right" : "left",
            layout: floatsRight ? "mediaTextRight" : "mediaTextLeft",
          },
        );
        if (imageBlock) {
          blocks.push(imageBlock);
        }
      }

      const content = element.find(".wp-block-media-text__content").first();
      const contentBlocks = await convertNodes(content.contents().toArray(), context);
      blocks.push(...contentBlocks);
      blocks.push({
        _type: "layoutBreak",
        _key: stableKey(
          `layoutBreak:${context.post.slug}:${blocks.length}:${floatsRight ? "right" : "left"}`,
        ),
        kind: "clearBoth",
      });
      continue;
    }

    if (tagName === "img") {
      const imageBlock = await convertImageElement(element, context, "inline");
      if (imageBlock) {
        blocks.push(imageBlock);
      }
      continue;
    }

    if (tagName === "div" || tagName === "section") {
      const contentBlocks = await convertNodes(element.contents().toArray(), context);
      blocks.push(...contentBlocks);
      continue;
    }

    if (/^h[1-4]$/.test(tagName)) {
      const style = tagName === "h1" ? "h2" : tagName;
      const block = paragraphToBlock(element, style, (href) =>
        context.linkResolver(href, context.post.slug),
      );
      if (block) {
        blocks.push(block);
      }
      continue;
    }

    if (tagName === "blockquote") {
      const block = paragraphToBlock(element, "blockquote", (href) =>
        context.linkResolver(href, context.post.slug),
      );
      if (block) {
        blocks.push(block);
      }
      continue;
    }

    if (tagName === "p") {
      const onlyStrongChild =
        element.children().length === 1 &&
        (element.children().first().get(0)?.tagName === "strong" ||
          element.children().first().get(0)?.tagName === "b");
      const style =
        className.includes("has-medium-font-size") && onlyStrongChild ? "h3" : "normal";
      const block = paragraphToBlock(element, style, (href) =>
        context.linkResolver(href, context.post.slug),
      );
      if (block) {
        blocks.push(block);
      }
      continue;
    }

    const fallbackBlocks = await convertNodes(element.contents().toArray(), context);
    blocks.push(...fallbackBlocks);
  }

  return blocks;
}

function validatePortableText(
  body: PortableTextNode[],
  requireAssets: boolean,
  warnings: string[],
  slug: string,
) {
  for (const node of body) {
    if (!node._type || !node._key) {
      warnings.push(`${slug}: body node missing required keys.`);
      return false;
    }

    if (node._type === "block") {
      if (!node.children?.length) {
        warnings.push(`${slug}: block node has no children.`);
        return false;
      }
    }

    if (node._type === "image" && requireAssets && !node.asset?._ref) {
      warnings.push(`${slug}: image block is missing a Sanity asset reference.`);
      return false;
    }
  }

  return body.length > 0;
}

async function downloadAssetToTemp(record: AssetRecord) {
  const response = await fetch(record.sourceUrl, {
    headers: {"user-agent": API_USER_AGENT},
  });
  if (!response.ok) {
    throw new Error(`Failed download ${record.sourceUrl}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = path.join(os.tmpdir(), `${stableKey(record.sourceUrl)}-${record.filename}`);
  await fs.writeFile(filePath, buffer);

  return {
    buffer,
    filePath,
    contentType: response.headers.get("content-type") || record.mimeType || "application/octet-stream",
  };
}

function createSanityWriteClient(options: MigrationOptions) {
  if (!options.projectId || !options.dataset || !options.writeToken) {
    return null;
  }

  return createClient({
    projectId: options.projectId,
    dataset: options.dataset,
    apiVersion: options.apiVersion,
    token: options.writeToken,
    useCdn: false,
  });
}

export async function runWordPressBlogMigration(options: MigrationOptions) {
  const reportDir = path.join(process.cwd(), "migration", "blog");
  await fs.mkdir(reportDir, {recursive: true});

  const writeClient = createSanityWriteClient(options);
  const source = await fetchWordPressSource();
  const relevantCategories = source.categories.filter((category) =>
    RELEVANT_CATEGORY_SLUGS.has(category.slug),
  );
  const relevantCategoryIds = new Set(relevantCategories.map((category) => category.id));
  const usersById = new Map(source.users.map((user) => [user.id, user]));
  const categoriesById = new Map(source.categories.map((category) => [category.id, category]));
  const tagsById = new Map(source.tags.map((tag) => [tag.id, tag]));
  const mediaCache = new Map<number, WpMedia | null>();
  const assetCache = new Map<string, string>();

  const state: MigrationState = {
    dryRun: options.dryRun,
    selectedPosts: [],
    brokenLinks: [],
    bodyWarnings: [],
    unresolvedRemoteMedia: [],
    featuredImagesUploaded: 0,
    inlineImagesUploaded: 0,
    duplicateAssetsReused: 0,
    failedAssetDownloads: [],
    migrationErrors: [],
    postsImported: 0,
    postsSkipped: 0,
    authorsUpserted: 0,
    categoriesUpserted: 0,
    tagsUpserted: 0,
    imageAlignmentCounts: {
      left: 0,
      center: 0,
      right: 0,
      none: 0,
      full: 0,
    },
    imageSizeCounts: {
      small: 0,
      medium: 0,
      large: 0,
      full: 0,
    },
    sampleImagePresentations: [],
  };

  async function fetchMediaById(mediaId: number) {
    if (mediaCache.has(mediaId)) {
      return mediaCache.get(mediaId) || null;
    }

    try {
      const media = await fetchJson<WpMedia>(`${WORDPRESS_API_BASE}/media/${mediaId}`);
      mediaCache.set(mediaId, media.json);
      return media.json;
    } catch (error) {
      state.failedAssetDownloads.push(`media:${mediaId} ${(error as Error).message}`);
      mediaCache.set(mediaId, null);
      return null;
    }
  }

  const selectedPosts = source.posts
    .filter(
      (post) =>
        post.status === "publish" &&
        post.type === "post" &&
        post.categories.some((categoryId) => relevantCategoryIds.has(categoryId)),
    )
    .sort((a, b) => new Date(b.date_gmt).getTime() - new Date(a.date_gmt).getTime());

  const selectedSlugs = new Set(selectedPosts.map((post) => post.slug));

  function linkResolver(href: string, sourceSlug: string) {
    if (!href) {
      return href;
    }

    try {
      const parsed = new URL(href, WORDPRESS_BASE_URL);
      if (parsed.hostname !== new URL(WORDPRESS_BASE_URL).hostname) {
        return href;
      }

      const pathname = normalizePathname(parsed.pathname);
      const maybeSlug = pathname.split("/").filter(Boolean).at(-1);
      if (maybeSlug && selectedSlugs.has(maybeSlug)) {
        return `/thrive-weekly/${maybeSlug}`;
      }

      if (KNOWN_PAGE_ROUTE_MAP.has(pathname)) {
        return KNOWN_PAGE_ROUTE_MAP.get(pathname) || href;
      }

      if (pathname.startsWith("/wp-content/uploads/")) {
        return href;
      }

      state.brokenLinks.push(`${sourceSlug}: unresolved internal link ${href}`);
      return href;
    } catch {
      return href;
    }
  }

  async function assetResolver(record: AssetRecord, kind: "featured" | "inline") {
    const imageBlock: PortableTextImageBlock = {
      _type: "image",
      _key: stableKey(`image:${record.sourceUrl}`),
      layout: record.presentation?.layout,
      alignment: record.presentation?.alignment,
      size: record.presentation?.size,
      displayWidth: record.presentation?.displayWidth,
      displayHeight: record.presentation?.displayHeight,
      aspectRatio: record.presentation?.aspectRatio,
      originalWidth: record.presentation?.originalWidth,
      originalHeight: record.presentation?.originalHeight,
      wordpressClasses: record.presentation?.classes,
      alt: record.alt,
      caption: record.caption,
      originalUrl: record.sourceUrl,
    };

    if (kind === "inline" && record.presentation) {
      state.imageAlignmentCounts[record.presentation.alignment] += 1;
      state.imageSizeCounts[record.presentation.size] += 1;
      if (state.sampleImagePresentations.length < 16) {
        state.sampleImagePresentations.push({
          postSlug: record.postSlug || "unknown",
          sourceUrl: record.sourceUrl,
          layout: record.presentation.layout,
          alignment: record.presentation.alignment,
          size: record.presentation.size,
          displayWidth: record.presentation.displayWidth,
          displayHeight: record.presentation.displayHeight,
          originalWidth: record.presentation.originalWidth,
          originalHeight: record.presentation.originalHeight,
          caption: record.caption,
          classes: record.presentation.classes,
        });
      }
    }

    if (options.dryRun || !writeClient) {
      return imageBlock;
    }

    const cachedAssetId = assetCache.get(record.sourceUrl);
    if (cachedAssetId) {
      imageBlock.asset = {_type: "reference", _ref: cachedAssetId};
      state.duplicateAssetsReused += 1;
      return imageBlock;
    }

    const existingAssetId = await writeClient.fetch<string | null>(
      `*[_type == "sanity.imageAsset" && source.url == $url][0]._id`,
      {url: record.sourceUrl},
    );

    if (existingAssetId) {
      assetCache.set(record.sourceUrl, existingAssetId);
      imageBlock.asset = {_type: "reference", _ref: existingAssetId};
      state.duplicateAssetsReused += 1;
      return imageBlock;
    }

    const downloaded = await downloadAssetToTemp(record);

    try {
      const uploaded = await writeClient.assets.upload("image", downloaded.buffer, {
        filename: record.filename,
        contentType: downloaded.contentType,
        source: {
          id: record.mediaId ? String(record.mediaId) : stableKey(record.sourceUrl),
          name: record.title || record.filename,
          url: record.sourceUrl,
        },
      });

      assetCache.set(record.sourceUrl, uploaded._id);
      imageBlock.asset = {_type: "reference", _ref: uploaded._id};

      if (kind === "featured") {
        state.featuredImagesUploaded += 1;
      } else {
        state.inlineImagesUploaded += 1;
      }
    } finally {
      await fs.rm(downloaded.filePath, {force: true});
    }

    return imageBlock;
  }

  const preparedPosts: SanityDocument[] = [];
  const authorDocs = new Map<string, SanityDocument>();
  const categoryDocs = new Map<string, SanityDocument>();
  const tagDocs = new Map<string, SanityDocument>();

  for (const post of selectedPosts) {
    const excerpt = stripHtml(post.excerpt.rendered);
    const embeddedAuthor = post._embedded?.author?.[0] || usersById.get(post.author);
    const embeddedFeaturedMedia = post._embedded?.["wp:featuredmedia"]?.[0] || null;
    const inlineMediaUrls: string[] = [];
    const unusualEmbeds: string[] = [];
    const mediaMatches = post.content.rendered.match(/https?:\/\/[^"'\s>]+/g) || [];
    for (const match of mediaMatches) {
      if (match.includes("/wp-content/uploads/")) {
        inlineMediaUrls.push(match);
      }
      if (match.includes("youtube.com/embed") || match.includes("youtu.be/")) {
        unusualEmbeds.push(match);
      }
    }

    const sourceRecord: SourcePostRecord = {
      wordpressId: post.id,
      title: cleanRenderedText(post.title.rendered),
      slug: post.slug,
      productionUrl: post.link,
      newUrl: `/thrive-weekly/${post.slug}`,
      date: post.date_gmt,
      modified: post.modified_gmt,
      authorId: embeddedAuthor?.id || post.author,
      authorSlug: embeddedAuthor?.slug || "",
      categoryIds: post.categories,
      categorySlugs: post.categories
        .map((categoryId) => categoriesById.get(categoryId)?.slug)
        .filter((slug): slug is string => Boolean(slug)),
      tagIds: post.tags,
      featuredMediaId: post.featured_media || embeddedFeaturedMedia?.id || null,
      featuredImageUrl: embeddedFeaturedMedia?.source_url || null,
      inlineMediaUrls: [...new Set(inlineMediaUrls)],
      excerpt: cleanRenderedText(excerpt),
      unusualEmbeds,
      selectionReasons: [
        "WordPress post type is `post`.",
        "Published status is `publish`.",
        "Post categories intersect with the Thrive Weekly editorial taxonomy.",
        "Archive content lives under the public `/thrive-weekly/` section while article URLs remain root-level WordPress slugs.",
      ],
    };
    state.selectedPosts.push(sourceRecord);

    const author = embeddedAuthor || usersById.get(post.author);
    if (author) {
      authorDocs.set(`wordpress-author-${author.id}`, {
        _id: `wordpress-author-${author.id}`,
        _type: "author",
        name: author.name,
        slug: {_type: "slug", current: author.slug || stableKey(author.name)},
        bio: author.description || undefined,
        wordpressId: author.id,
        sourceUrl: author.link,
        avatarUrl: author.avatar_urls?.["96"] || undefined,
      });
    }

    for (const categoryId of post.categories) {
      const category = categoriesById.get(categoryId);
      if (!category || !relevantCategoryIds.has(categoryId)) continue;
      categoryDocs.set(`wordpress-category-${category.id}`, {
        _id: `wordpress-category-${category.id}`,
        _type: "category",
        title: category.name,
        slug: {_type: "slug", current: category.slug},
        wordpressId: category.id,
        sourceUrl: category.link,
      });
    }

    for (const tagId of post.tags) {
      const tag = tagsById.get(tagId);
      if (!tag) continue;
      tagDocs.set(`wordpress-tag-${tag.id}`, {
        _id: `wordpress-tag-${tag.id}`,
        _type: "tag",
        title: tag.name,
        slug: {_type: "slug", current: tag.slug},
        wordpressId: tag.id,
        sourceUrl: tag.link,
      });
    }
  }

  for (const post of selectedPosts) {
    try {
      const convertedBody = await convertNodes(post.content ? cheerio.load(post.content.rendered).root().contents().toArray() : [], {
        assetResolver,
        linkResolver,
        fetchMediaById,
        state,
        post,
      });
      const body = ensureUniquePortableTextKeys(convertedBody, `wordpress-post-${post.id}`);

      const featuredMedia =
        post._embedded?.["wp:featuredmedia"]?.[0] ||
        (post.featured_media ? await fetchMediaById(post.featured_media) : null);

      const mainImage = featuredMedia
        ? await assetResolver(
            {
              sourceUrl: featuredMedia.source_url,
              mediaId: featuredMedia.id,
              alt: featuredMedia.alt_text || undefined,
              caption: stripHtml(featuredMedia.caption.rendered || "") || undefined,
              title: stripHtml(featuredMedia.title.rendered || "") || undefined,
              mimeType: featuredMedia.mime_type,
              filename:
                featuredMedia.media_details?.file?.split("/").pop() ||
                featuredMedia.source_url.split("/").pop() ||
                `featured-${featuredMedia.id}`,
            },
            "featured",
          )
        : undefined;

      const excerpt = stripHtml(post.excerpt.rendered);
      const cleanTitle = cleanRenderedText(post.title.rendered);

      if (!validatePortableText(body, Boolean(writeClient && !options.dryRun), state.bodyWarnings, post.slug)) {
        state.postsSkipped += 1;
        continue;
      }

      const author = usersById.get(post.author) || post._embedded?.author?.[0];
      const seoDescription = excerpt || undefined;
      const prepared = {
        _id: `wordpress-post-${post.id}`,
        _type: "blogPost",
        title: cleanTitle,
        slug: {_type: "slug", current: post.slug},
        excerpt: excerpt || undefined,
        publishedAt: toIsoFromGmt(post.date_gmt || post.date),
        originalModifiedAt: toIsoFromGmt(post.modified_gmt || post.modified),
        author: author ? {_type: "reference", _ref: `wordpress-author-${author.id}`} : undefined,
        categories: post.categories
          .filter((categoryId) => relevantCategoryIds.has(categoryId))
          .map((categoryId) => ({_type: "reference", _ref: `wordpress-category-${categoryId}`, _key: stableKey(`cat:${post.id}:${categoryId}`)})),
        tags: post.tags.map((tagId) => ({
          _type: "reference",
          _ref: `wordpress-tag-${tagId}`,
          _key: stableKey(`tag:${post.id}:${tagId}`),
        })),
        mainImage: mainImage
          ? {
              _type: "image",
              alt: mainImage.alt,
              caption: mainImage.caption,
              originalUrl: mainImage.originalUrl,
              asset: mainImage.asset,
            }
          : undefined,
        body,
        seoTitle: cleanTitle,
        seoDescription,
        originalWordpressUrl: post.link,
        wordpressId: post.id,
        migrationSource: {
          system: "wordpress",
          contentType: post.type,
          migratedAt: new Date().toISOString(),
        },
      };

      preparedPosts.push(prepared);
    } catch (error) {
      state.migrationErrors.push(`${post.slug}: ${(error as Error).message}`);
      state.postsSkipped += 1;
    }
  }

  if (!options.dryRun && writeClient) {
    const docsToUpsert = [
      ...authorDocs.values(),
      ...categoryDocs.values(),
      ...tagDocs.values(),
      ...preparedPosts,
    ];

    for (let index = 0; index < docsToUpsert.length; index += 20) {
      const batch = docsToUpsert.slice(index, index + 20);
      const transaction = writeClient.transaction();
      for (const document of batch) {
        transaction.createOrReplace(document);
      }
      await transaction.commit();
    }

    state.authorsUpserted = authorDocs.size;
    state.categoriesUpserted = categoryDocs.size;
    state.tagsUpserted = tagDocs.size;
    state.postsImported = preparedPosts.length;
  }

  const urlMap = state.selectedPosts.map((post) => ({
    originalWordpressUrl: post.productionUrl,
    newUrl: post.newUrl,
    redirectRequired: post.productionUrl.endsWith(`/thrive-weekly/${post.slug}/`) ? false : true,
  }));

  const importReport = {
    generatedAt: new Date().toISOString(),
    dryRun: options.dryRun,
    wordpressBaseUrl: WORDPRESS_BASE_URL,
    wordpressEndpointsUsed: [
      `${WORDPRESS_BASE_URL}/wp-json`,
      `${WORDPRESS_API_BASE}/types`,
      `${WORDPRESS_API_BASE}/posts?_embed=1&per_page=100&page=*`,
      `${WORDPRESS_API_BASE}/categories?per_page=100`,
      `${WORDPRESS_API_BASE}/tags?per_page=100`,
      `${WORDPRESS_API_BASE}/users?per_page=100`,
      `${WORDPRESS_API_BASE}/media/:id`,
      BLOG_ARCHIVE_URL,
    ],
    sanityProjectId: options.projectId || null,
    sanityDataset: options.dataset || null,
    totalWordpressPostsInspected: source.postsTotal,
    wordpressPostPagesInspected: source.postsTotalPages,
    thriveWeeklyPostsSelected: state.selectedPosts.length,
    postsPrepared: preparedPosts.length,
    postsImported: state.postsImported,
    postsSkipped: state.postsSkipped,
    authorsPrepared: authorDocs.size,
    authorsImported: state.authorsUpserted,
    categoriesPrepared: categoryDocs.size,
    categoriesImported: state.categoriesUpserted,
    tagsPrepared: tagDocs.size,
    tagsImported: state.tagsUpserted,
    featuredImagesUploaded: state.featuredImagesUploaded,
    inlineImagesUploaded: state.inlineImagesUploaded,
    duplicateAssetsReused: state.duplicateAssetsReused,
    imagePresentationSummary: {
      alignmentCounts: state.imageAlignmentCounts,
      sizeCounts: state.imageSizeCounts,
      sampleImagePresentations: state.sampleImagePresentations,
    },
    failedAssetDownloads: state.failedAssetDownloads,
    bodyConversionWarnings: state.bodyWarnings,
    brokenLinks: state.brokenLinks,
    migrationErrors: state.migrationErrors,
    customPostTypes: Object.keys(source.types).filter(
      (typeName) => !["post", "page", "attachment"].includes(typeName),
    ),
    tagsAvailable: source.tags.length,
    archiveSignals: {
      archiveUrl: BLOG_ARCHIVE_URL,
      rootLevelArticleUrls: state.selectedPosts.slice(0, 5).map((post) => post.productionUrl),
    },
    realImportResult:
      options.dryRun || !writeClient
        ? "No Sanity mutations executed."
        : `Imported ${preparedPosts.length} blog posts.`,
  };

  const unresolvedLines = [
    "# Thrive Weekly Migration Unresolved Items",
    "",
    `- Dry run: ${options.dryRun ? "yes" : "no"}`,
    writeClient ? "" : "- No Sanity write client was configured, so mutation was skipped.",
    ...state.brokenLinks.map((entry) => `- Broken or unresolved internal link: ${entry}`),
    ...state.bodyWarnings.map((entry) => `- Body conversion warning: ${entry}`),
    ...state.failedAssetDownloads.map((entry) => `- Asset download failed: ${entry}`),
    ...state.migrationErrors.map((entry) => `- Migration error: ${entry}`),
  ].filter(Boolean);

  await fs.writeFile(
    path.join(reportDir, "source-posts.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalWordpressPostsInspected: source.postsTotal,
        thriveWeeklyPostsSelected: state.selectedPosts.length,
        posts: state.selectedPosts,
      },
      null,
      2,
    ),
  );
  await fs.writeFile(path.join(reportDir, "import-report.json"), JSON.stringify(importReport, null, 2));
  await fs.writeFile(path.join(reportDir, "url-map.json"), JSON.stringify(urlMap, null, 2));
  await fs.writeFile(path.join(reportDir, "unresolved-items.md"), unresolvedLines.join("\n"));

  return {
    importReport,
    selectedPosts: state.selectedPosts,
    writeClientConfigured: Boolean(writeClient),
  };
}
