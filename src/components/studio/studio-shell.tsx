"use client";

import {NextStudio} from "next-sanity/studio/client-component";
import config from "../../../sanity.config";

export function StudioShell() {
  return <NextStudio config={config} />;
}
