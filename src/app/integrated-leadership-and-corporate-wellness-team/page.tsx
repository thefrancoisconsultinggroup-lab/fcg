import { TeamPageScene } from "@/components/team/team-page-scene";
import { sitePages } from "@/data/pages";
import { pageMetadata } from "@/lib/metadata";

const page = sitePages.team;

export const metadata = pageMetadata(page);

export default function TeamPage() {
  return (
    <>
      <TeamPageScene />
    </>
  );
}
