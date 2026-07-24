export type BlogCategory = {
  _id: string;
  title: string;
  slug: string;
};

export type BlogImage = {
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
  originalUrl?: string;
  asset?: {
    url: string;
    metadata?: {
      dimensions?: {
        width: number;
        height: number;
        aspectRatio: number;
      };
    };
  };
};

export type BlogAuthor = {
  name: string;
  slug?: string;
  bio?: string;
};

export type BlogPostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  mainImage?: BlogImage;
  categories: BlogCategory[];
};

export type PortableBodyNode =
  | {
      _type: "block";
      _key?: string;
      style?: string;
      children?: Array<{
        _type: "span";
        _key?: string;
        text: string;
        marks?: string[];
      }>;
      markDefs?: Array<{
        _key: string;
        _type: string;
        href?: string;
      }>;
      listItem?: "bullet" | "number";
      level?: number;
    }
  | ({
      _type: "image";
      _key?: string;
    } & BlogImage)
  | {
      _type: "layoutBreak";
      _key?: string;
      kind?: "clearBoth";
    }
  | {
      _type: "externalEmbed";
      _key?: string;
      url: string;
      provider?: string;
      title?: string;
    };

export type BlogPost = BlogPostSummary & {
  seoTitle?: string;
  seoDescription?: string;
  originalWordpressUrl: string;
  originalModifiedAt?: string;
  author?: BlogAuthor;
  body: PortableBodyNode[];
};
