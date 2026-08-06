import type { MetadataRoute } from "next";
import { isRefundPolicyPublished, legalPolicyVersions } from "@/lib/legal";

const baseUrl = "https://francoisconsultinggroup.com";
const lastModified = new Date("2026-08-06T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/about-us",
    "/contact",
    "/faith",
    "/human-capacity-summit",
    "/integrated-leadership-and-corporate-wellness-team",
    "/neumi-wellness",
    "/privacy-policy",
    "/programs-services",
    "/terms-and-conditions",
    "/thrive-weekly",
  ];

  if (isRefundPolicyPublished()) {
    routes.push(legalPolicyVersions.refund.route);
  }

  return routes.map((route) => ({
    changeFrequency: route === "/" ? "weekly" : "monthly",
    lastModified,
    priority: route === "/" ? 1 : route === "/human-capacity-summit" ? 0.9 : 0.7,
    url: `${baseUrl}${route}`,
  }));
}
