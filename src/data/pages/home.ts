import type { MigratedPageContent } from "@/data/pages/types";

export const homePageContent: MigratedPageContent = {
  sections: [
    {
      eyebrow: "Welcome",
      heading: "My Why",
      image: {
        src: "/assets/images/my-why.png",
        alt: "Christine Francois",
      },
      body: [
        "My journey into wellness and transformation is anchored in faith. I’ve walked through grief, watched illness unravel someone I loved, and made choices no woman ever expects to make. But through it all, I never walked alone. God was there, whispering, guiding, comforting, and sometimes carrying me when I had no strength left.",
        "I believe nothing in my life has been an accident, not even the night a tiny stray kitten chose our doorstep and helped restart our hearts.",
        "That moment was the beginning of a new chapter; one where healing, love, and purpose found their way back in. I believe that health is sacred, that our bodies and souls are deeply connected, and that every person deserves to feel whole.",
        "My work today is a direct extension of that belief. I’m not just here to help people improve their health. I’m here to remind them that they’re not alone, that they’re seen, and that restoration is possible, no matter how far gone things may seem.",
      ],
    },
    {
      eyebrow: "Wellness",
      heading: "Neumi Wellness",
      body: [
        "The home experience introduces Neumi wellness products alongside the founder’s wellness story, with practical pathways for everyday vitality and whole-person restoration.",
      ],
      cards: [
        {
          title: "NutriSwish",
          image: {
            src: "/assets/migrated/home/home-nutriswish.webp",
            alt: "NutriSwish product image",
          },
          body: ["Your body at full potential"],
          links: [
            {
              label: "Shop NutriSwish",
              href: "https://neumi.com/dragonberry1691/shopping/item?itemId=300",
            },
          ],
        },
        {
          title: "Neumi Skin",
          image: {
            src: "/assets/migrated/home/home-neumi-skin.webp",
            alt: "Neumi Skin product image",
          },
          links: [
            {
              label: "Shop Neumi Skin",
              href: "https://neumi.com/dragonberry1691/shopping/item?itemId=301",
            },
          ],
        },
        {
          title: "Neuro",
          image: {
            src: "/assets/migrated/home/home-neuro-1.webp",
            alt: "Neuro product image",
          },
          links: [
            {
              label: "Shop Neuro",
              href: "https://neumi.com/dragonberry1691/shopping/item?itemId=398",
            },
          ],
        },
        {
          title: "Hers",
          image: {
            src: "/assets/migrated/home/home-hers.webp",
            alt: "Hers product image",
          },
          links: [
            {
              label: "Shop Hers",
              href: "https://neumi.com/dragonberry1691/shopping/item?itemId=188",
            },
          ],
        },
        {
          title: "Neumi Hair",
          image: {
            src: "/assets/migrated/home/home-neumi-hair-1.webp",
            alt: "Neumi Hair product image",
          },
          body: ["Anti-Aging For Your Hair™"],
          links: [
            {
              label: "Shop Neumi Hair",
              href: "https://neumi.com/dragonberry1691/shopping/item?itemId=560",
            },
          ],
        },
      ],
      links: [
        {
          label: "Neumi Shop",
          href: "https://neumi.com/dragonberry1691",
        },
      ],
    },
  ],
};
