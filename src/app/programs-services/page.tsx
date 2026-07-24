import { ProgramsServicesPageScene } from "@/components/programs/programs-services-page-scene";
import { sitePages } from "@/data/pages";
import { pageMetadata } from "@/lib/metadata";

const page = sitePages.programsServices;

export const metadata = pageMetadata(page);

export default function ProgramsServicesPage() {
  return (
    <>
      <ProgramsServicesPageScene />
    </>
  );
}
