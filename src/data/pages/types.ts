export type ContentImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type ContentLink = {
  label: string;
  href: string;
};

export type ContentCard = {
  title: string;
  body?: string[];
  image?: ContentImage;
  links?: ContentLink[];
};

export type ContentSection = {
  eyebrow?: string;
  heading: string;
  body?: string[];
  image?: ContentImage;
  cards?: ContentCard[];
  links?: ContentLink[];
};

export type MigratedPageContent = {
  sections: ContentSection[];
};
