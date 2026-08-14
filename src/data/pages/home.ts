import type { MigratedPageContent } from "@/data/pages/types";

export const homePageContent: MigratedPageContent = {
  sections: [
    {
      eyebrow: "Welcome",
      heading: "My Why",
      image: {
        src: "/assets/images/my-why.webp",
        alt: "Christine Francois",
      },
      body: [
        "I believe every human being carries extraordinary capacity—the capacity to think, create, lead, care, adapt, hope and contribute meaningfully to the world.",
        "Yet I have also seen how illness, grief, chronic stress and systems that fail to recognise the whole person can gradually diminish that capacity. I know what it means to watch someone you love unravel—and to make choices no woman ever expects to face.",
        "Those experiences changed the way I understand wellness, leadership and the responsibility we carry for one another.",
        "They are why François Consulting Group exists.",
        "FCG was founded to help leaders, organisations and communities recognise, protect and strengthen the human capacity upon which every meaningful future depends. Because healthier organisations, stronger societies and more resilient communities are built by people whose minds, bodies, dignity and potential are supported—not depleted.",
        "My journey has always been anchored in faith. Through every season, God has guided, comforted and sometimes carried me when I had no strength left. I believe nothing in my life has been accidental—not even the night a tiny stray kitten arrived at our doorstep and helped restart our hearts.",
        "That same faith continues to shape the work I am called to do: bringing people, knowledge, relationships and resources together to help create a world in which human beings—and the generations who follow us—have the opportunity not merely to survive, but to flourish.",
      ],
    },
    {
      eyebrow: "Wellness",
      heading: "Neumi Wellness",
      body: [
        "The home experience introduces Neumi wellness products alongside the founder's wellness story, with practical pathways for everyday vitality and whole-person restoration.",
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
          body: ["Anti-Aging For Your Hair"],
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
