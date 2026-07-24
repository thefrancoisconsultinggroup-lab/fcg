export type NavigationItem = {
  label: string;
  href: string;
  children?: NavigationItem[];
};

export const mainNavigation = [
  {
    label: "About Us",
    href: "/about-us",
    children: [
      { label: "About Us", href: "/about-us" },
      { label: "Faith", href: "/faith" },
    ],
  },
  {
    label: "Programs & Services",
    href: "/programs-services",
    children: [
      {
        label: "Integrated Leadership & Corporate Wellness",
        href: "/programs-services",
      },
      {
        label: "The Team",
        href: "/integrated-leadership-and-corporate-wellness-team",
      },
    ],
  },
  { label: "Human Capacity Summit", href: "/human-capacity-summit" },
  { label: "Neumi Wellness", href: "/neumi-wellness" },
  { label: "Thrive Weekly", href: "/thrive-weekly" },
] satisfies NavigationItem[];

export const footerNavigation = mainNavigation.flatMap((item) =>
  item.children?.length ? item.children : [item],
);
