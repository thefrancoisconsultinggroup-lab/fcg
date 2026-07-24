import type { PageMediaKey } from "@/data/page-media";

type PageCta = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export type SitePage = {
  route: string;
  metadataTitle: string;
  metadataTitleAbsolute?: boolean;
  metadataDescription: string;
  metadataImage?: string;
  eyebrow: string;
  heading: string;
  heroDescription: string;
  mediaKey: PageMediaKey;
  primaryCta?: PageCta;
  secondaryCta?: PageCta;
};

export const sitePages = {
  aboutUs: {
    route: "/about-us",
    metadataTitle: "About François Consulting Group | The Human Capacity Company",
    metadataTitleAbsolute: true,
    metadataDescription:
      "Discover how François Consulting Group strengthens human capacity through leadership development, corporate wellness, strategic advisory, thought leadership and The Human Capacity Summit.",
    metadataImage: "/assets/images/Francois-About.jpg",
    eyebrow: "About François Consulting Group",
    heading: "The Human Capacity Company",
    heroDescription:
      "Strengthening the capacity of people, organizations and communities to thrive in a changing world.",
    mediaKey: "aboutUs",
  },
  faith: {
    route: "/faith",
    metadataTitle: "Faith & Purpose",
    metadataDescription:
      "Faith-focused visual content from Francois Consulting Group.",
    eyebrow: "Faith",
    heading: "Faith & Purpose",
    heroDescription:
      "A reflective space for faith, purpose and the deeper transformation work behind Francois Consulting Group.",
    mediaKey: "faith",
  },
  programsServices: {
    route: "/programs-services",
    metadataTitle: "Integrated Leadership & Corporate Wellness",
    metadataDescription:
      "Integrated leadership development and corporate wellness services from Francois Consulting Group.",
    eyebrow: "Programs & Services",
    heading: "Integrated Leadership & Corporate Wellness",
    heroDescription:
      "Designed to elevate performance, engagement and organizational resilience by combining leadership development with holistic employee well-being.",
    mediaKey: "programsServices",
  },
  team: {
    route: "/integrated-leadership-and-corporate-wellness-team",
    metadataTitle: "Meet the Team",
    metadataDescription:
      "Meet the Integrated Leadership and Corporate Wellness team.",
    eyebrow: "The Team",
    heading: "Meet the Team",
    heroDescription:
      "The people connected to the Integrated Leadership and Corporate Wellness program.",
    mediaKey: "team",
  },
  neumiWellness: {
    route: "/neumi-wellness",
    metadataTitle: "Neumi Wellness",
    metadataDescription:
      "A dedicated wellness page for Neumi-related content and resources.",
    eyebrow: "Wellness",
    heading: "Neumi Wellness",
    heroDescription: "The 30-second ritual that changes everything.",
    mediaKey: "neumiWellness",
  },
  thriveWeekly: {
    route: "/thrive-weekly",
    metadataTitle: "Thrive Weekly",
    metadataDescription:
      "The editorial home for Thrive Weekly content from Francois Consulting Group.",
    eyebrow: "Editorial",
    heading: "Thrive Weekly",
    heroDescription:
      "A public editorial archive spanning leadership, lifestyle and wellness at work.",
    mediaKey: "thriveWeekly",
  },
  contact: {
    route: "/contact",
    metadataTitle: "Start a Conversation",
    metadataDescription: "Get in touch with Francois Consulting Group.",
    eyebrow: "Contact",
    heading: "Start a Conversation",
    heroDescription:
      "Let’s connect. Reach out with your ideas, feedback, or inquiries.",
    mediaKey: "contact",
  },
} satisfies Record<string, SitePage>;
