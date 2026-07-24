export type PageMedia = {
  desktopVideo?: string;
  mobileVideo?: string;
  desktopImage?: string;
  mobileImage?: string;
  imagePosition?: string;
  poster?: string;
};

export const pageMedia = {
  home: {
    desktopVideo: "/assets/videos/home-hero.mp4",
  },
  aboutUs: {
    desktopImage: "/assets/images/Francois-About.jpg",
    imagePosition: "center 78%",
  },
  faith: {},
  programsServices: {},
  team: {},
  neumiWellness: {
    desktopVideo: "/assets/videos/neumi-wellness-hero.mp4",
  },
  thriveWeekly: {
    desktopVideo: "/assets/videos/thrive-weekly-hero.mp4",
  },
  contact: {
    desktopVideo: "/assets/videos/error404-hero.mp4",
  },
  notFound: {
    desktopVideo: "/assets/videos/error404-hero.mp4",
  },
} satisfies Record<string, PageMedia>;

export type PageMediaKey = keyof typeof pageMedia;
