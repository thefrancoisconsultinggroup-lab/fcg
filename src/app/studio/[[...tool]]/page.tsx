import {metadata, viewport} from "next-sanity/studio";
import {StudioShell} from "@/components/studio/studio-shell";

export {metadata, viewport};

export default function StudioPage() {
  return <StudioShell />;
}
