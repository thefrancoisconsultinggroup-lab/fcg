import type { MigratedPageContent } from "@/data/pages/types";

export const aboutUsPageContent: MigratedPageContent = {
  sections: [
    {
      heading: "About Francois Consulting Group",
      image: {
        src: "/assets/migrated/about-us/about-us-3-6.png",
        alt: "Francois Consulting Group visual identity",
      },
      body: [
        "Our Team is a collective of passionate change agents with a shared commitment to catalyzing personal and organizational transformation.",
        "Through our Integrated Leadership & Corporate Wellness (ILCW) program, we partner with visionary, like-minded organizations and professionals to help individuals, families, and communities thrive, starting within the workplace.",
        "We believe that organizations are powerful access points for lasting change, and our work is designed to elevate leadership, enhance wellness, and support purposeful transformation.",
      ],
    },
    {
      heading: "Vision",
      body: [
        "To be the partner of choice across the Caribbean and Pan American region for Integrated Leadership and Immersive Holistic Corporate Wellness, delivering transformative programs that elevate people, performance, and purpose from the C-suite to the front line.",
      ],
    },
    {
      heading: "Mission",
      body: [
        "To serve as a trusted hub and catalyst for holistic well-being, resilient leadership, and collaborative growth, by designing and delivering tailored wellness experiences that empower individuals to reclaim their health, vitality, and voice; enable teams to connect, trust, and thrive; and invite every partner and contributor into a shared-value ecosystem where everyone wins.",
        "Through this mission, we create a movement of wellness-centered leadership where inner alignment fuels outer impact.",
      ],
    },
    {
      heading: "Strategic Partners",
      cards: [
        {
          title: "American Brain Council",
          image: {
            src: "/assets/migrated/about-us/about-us-american-brain-council-banner-logo-500x275-1.jpg",
            alt: "American Brain Council logo",
          },
          links: [{ label: "Visit American Brain Council", href: "https://www.abcbrain.org/" }],
        },
        {
          title: "Power10",
          image: {
            src: "/assets/migrated/about-us/about-us-power10-logo-v8-scaled.webp",
            alt: "Power10 logo",
          },
          body: [
            "Nicole Quan Kep is the founder of Power10HK and KEP-STAR, two Hong Kong-based enterprises that reflect her passion for connecting people, performance, and purpose across borders.",
            "Nicole’s dual enterprises complement Francois Consulting Group’s Integrated Leadership & Corporate Wellness programs, amplifying their shared mission to foster high-performing, values-aligned teams and sustainable international growth.",
          ],
          links: [{ label: "Visit Power10HK", href: "https://power10hk.com/" }],
        },
      ],
    },
    {
      heading: "Our Core Values",
      image: {
        src: "/assets/migrated/about-us/about-us-our-core-values.jpg",
        alt: "Our Core Values graphic",
      },
      cards: [
        { title: "Guided by Purpose" },
        { title: "Collaboration Over Competition" },
        { title: "Whole-Person Empowerment" },
        { title: "Integrity in Action" },
        { title: "Inclusion and Cultural Intelligence" },
        { title: "Visionary Growth" },
      ],
    },
  ],
};
