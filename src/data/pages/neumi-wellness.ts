import type { MigratedPageContent } from "@/data/pages/types";

export const neumiWellnessPageContent: MigratedPageContent = {
  sections: [
    {
      heading: "Lifestyle",
      body: [
        "The 30-second ritual that changes everything.",
        "Traditional supplements waste 80% of nutrients. Neumi’s HydraStat™ Delivery sends them straight to your cells.",
        "The proof is in their results: clinical trials, thousands of testimonials, viral videos.",
        "But seek first the kingdom of God and his righteousness, and all these things will be added to you.",
      ],
      links: [{ label: "Learn More", href: "https://neumi.com/dragonberry1691" }],
    },
    {
      heading: "Products",
      cards: [
        { title: "NutriSwish", image: { src: "/assets/migrated/neumi-wellness/neumi-wellness-nutriswish.webp", alt: "NutriSwish product image" }, body: ["Your body at full potential"], links: [{ label: "Shop NutriSwish", href: "https://neumi.com/dragonberry1691/shopping/item?itemId=300" }] },
        { title: "Neumi Skin", image: { src: "/assets/migrated/neumi-wellness/neumi-wellness-neumi-skin.webp", alt: "Neumi Skin product image" }, links: [{ label: "Shop Neumi Skin", href: "https://neumi.com/dragonberry1691/shopping/item?itemId=301" }] },
        { title: "Neuro", image: { src: "/assets/migrated/neumi-wellness/neumi-wellness-neuro-1.webp", alt: "Neuro product image" }, links: [{ label: "Shop Neuro", href: "https://neumi.com/dragonberry1691/shopping/item?itemId=398" }] },
        { title: "Hers", image: { src: "/assets/migrated/neumi-wellness/neumi-wellness-hers.webp", alt: "Hers product image" }, links: [{ label: "Shop Hers", href: "https://neumi.com/dragonberry1691/shopping/item?itemId=188" }] },
        { title: "Neumi Hair", image: { src: "/assets/migrated/neumi-wellness/neumi-wellness-neumi-hair-1.webp", alt: "Neumi Hair product image" }, body: ["Anti-Aging For Your Hair™"], links: [{ label: "Shop Neumi Hair", href: "https://neumi.com/dragonberry1691/shopping/item?itemId=560" }] },
      ],
    },
  ],
};
