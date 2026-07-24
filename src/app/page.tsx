import type { Metadata } from "next";
import { HomeImmersiveScene } from "@/components/home/home-immersive-scene";

export const metadata: Metadata = {
  title: "Francois Consulting Group",
  description:
    "Purpose-driven leadership and integrated wellness experiences designed to help individuals and organisations thrive.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Francois Consulting Group",
    description:
      "Purpose-driven leadership and integrated wellness experiences designed to help individuals and organisations thrive.",
    url: "/",
    siteName: "Francois Consulting Group",
    type: "website",
  },
};

export default function Home() {
  return <HomeImmersiveScene />;
}
