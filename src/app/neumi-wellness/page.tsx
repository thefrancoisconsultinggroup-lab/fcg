import { NeumiWellnessPageScene } from "@/components/neumi/neumi-wellness-page-scene";
import { sitePages } from "@/data/pages";
import { pageMetadata } from "@/lib/metadata";

const page = sitePages.neumiWellness;

export const metadata = pageMetadata(page);

export default function NeumiWellnessPage() {
  return <NeumiWellnessPageScene />;
}
