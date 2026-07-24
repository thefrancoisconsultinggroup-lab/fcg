export const programsServicesHeroImage = {
  src: "/assets/migrated/programs-services/programs-services-integrated-wellness-programme.png",
  alt: "Professionals on a staircase representing integrated leadership and corporate wellness.",
  objectPosition: "52% 42%",
};

export const programsServicesIntro = {
  eyebrow: "Integrated Leadership & Corporate Wellness",
  heading: "Integrated Leadership & Corporate Wellness",
  description:
    "Designed to elevate performance, engagement, and organizational resilience by combining leadership development with holistic employee well-being.",
  body: [
    "Our Integrated Leadership & Corporate Wellness Program is designed to elevate performance, engagement, and organizational resilience by combining leadership development with holistic employee well-being.",
    "Through personalized executive coaching, interactive team workshops, and tailored consulting packages, we help companies foster a culture of trust, collaboration, and lasting wellness — empowering both leaders and teams to thrive.",
  ],
  teamLink: {
    label: "Meet The Team",
    href: "/integrated-leadership-and-corporate-wellness-team",
  },
};

export const programsServicesOfferings = [
  {
    number: "01",
    title: "1:1 Executive Coaching",
    image: {
      src: "/assets/migrated/programs-services/programs-services-1-on-1.jpg",
      alt: "Executive coaching visual",
    },
    body: "Personalized coaching sessions designed to strengthen leadership skills, enhance decision-making, and foster resilience. Our executive coaching empowers leaders to navigate complex challenges while modeling wellness-driven behaviors for their teams.",
  },
  {
    number: "02",
    title: "Team Workshops",
    image: {
      src: "/assets/migrated/programs-services/programs-services-integrated-leadership-corporate-wellness-program.jpg",
      alt: "Team workshop visual",
    },
    body: "Interactive workshops that build collaboration, trust, and effective communication within teams. Participants engage in practical exercises that integrate leadership principles with wellness strategies to boost morale, productivity, and engagement.",
  },
  {
    number: "03",
    title: "Consulting Packages",
    image: {
      src: "/assets/migrated/programs-services/programs-services-consulting-packages.jpg",
      alt: "Consulting packages visual",
    },
    body: "Tailored consulting solutions that align leadership development and corporate wellness with your organization’s strategic goals. Flexible packages include actionable recommendations, implementation support, and options to request a custom quote for your unique needs.",
  },
] as const;

export const consultationPackagesIntro = {
  eyebrow: "Consultation Packages",
  heading: "Consultation Packages",
  description:
    "Custom solutions that integrate leadership growth with holistic employee well-being for lasting organizational impact.",
};

export const consultationPackages = [
  {
    name: "Gold",
    accent: "gold" as const,
    description:
      "2 Workshops • 3 Months Beyond Yoga • 2 Coaching Sessions",
    features: [
      "Two (2) Interactive Workshops per annum (Max. 3 hours)",
      "(Select your preferred topics from the list provided below and align your organization’s initiatives and focus with any of the UN International Days of Recognition provided)",
      "Three (3) months Subscription to Beyond Yoga Services – (months run consecutively) and includes:",
      "unlimited access to classes in-studio",
      "includes access to online platform (live-streams and class library)",
      "includes sponsored *by-donation* class weekly",
      "includes two optional private classes in-studio or on-site (teacher-restricted)",
      "Two (2) Personalized Coaching Sessions (1-on-1 coaching, fully customizable to the client’s needs for (1) key leader or high–potential employee)",
      "Flexible focus areas: Leadership growth, confidence-building, personal development, productivity, career strategy, or any area of personal/professional concern.",
    ],
  },
  {
    name: "Platinum",
    accent: "platinum" as const,
    description:
      "4 Workshops • 6 Months Beyond Yoga • 4 Coaching Sessions",
    features: [
      "Four (4) Interactive Workshops per annum (Max. 3 hours)",
      "(Select your preferred topics from the list provided below and align your organization’s initiatives and focus with any of the UN International Days of Recognition provided)",
      "Six (6) months Subscription to Beyond Yoga Services – (months run consecutively) and includes:",
      "unlimited access to classes in-studio",
      "includes access to online platform (live-streams and class library)",
      "includes sponsored *by-donation* class weekly",
      "includes two optional private classes in-studio or on-site (teacher-restricted)",
      "Four (4) Personalized Coaching Sessions (1-on-1 coaching, fully customizable to the client’s needs for (1) key leader or high–potential employee)",
      "Flexible focus areas: Professional development, personal fulfilment, leadership skills, stress management, decision-making, or any other topic relevant to the client.",
    ],
  },
  {
    name: "Diamond",
    accent: "diamond" as const,
    description:
      "6 Workshops • 12 Months Beyond Yoga • 6 Coaching Sessions",
    features: [
      "Six (6) Interactive Workshops per annum (Max. 3 hours)",
      "(Select your preferred topics from the list provided below and align your organization’s initiatives and focus with any of the UN International Days of Recognition provided)",
      "One (1) year’s Subscription to Beyond Yoga Services – 12-month subscription (runs consecutively) and includes:",
      "unlimited access to classes in-studio",
      "includes access to online platform (live streams and class library)",
      "includes sponsored *by-donation* class weekly",
      "includes two optional private classes in-studio or on-site (teacher restricted)",
      "Six (6) Personalized Coaching Sessions (1-on-1 coaching, fully customizable to the client’s needs for one (1) key leader or high–potential employee)",
      "Flexible focus areas: Career advancement, leadership development, personal growth, work-life balance, resilience, emotional intelligence, confidence-building, or any other area of concern.",
    ],
  },
] as const;

export const programsServicesCtas = {
  customQuote: {
    label: "Get a Custom Quote",
    href: "/contact",
  },
};

export const programsServicesPageContent = {
  sections: [
    {
      heading: programsServicesIntro.heading,
      image: programsServicesHeroImage,
      body: programsServicesIntro.body,
      links: [programsServicesIntro.teamLink],
    },
    {
      heading: "What We Offer",
      body: [programsServicesIntro.description],
      cards: programsServicesOfferings.map((offering) => ({
        title: offering.title,
        image: offering.image,
        body: [offering.body],
      })),
    },
    {
      heading: consultationPackagesIntro.heading,
      body: [consultationPackagesIntro.description],
      links: [programsServicesCtas.customQuote],
    },
  ],
};
