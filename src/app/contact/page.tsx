import { ContactPageScene } from "@/components/contact/contact-page-scene";
import { sitePages } from "@/data/pages";
import { pageMetadata } from "@/lib/metadata";

const page = sitePages.contact;

export const metadata = pageMetadata(page);

export default function ContactPage() {
  return <ContactPageScene />;
}
