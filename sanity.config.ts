import {defineConfig} from "sanity";
import {structureTool} from "sanity/structure";
import {schemaTypes} from "./src/sanity/schemaTypes";

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset =
  process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineConfig({
  name: "francois-consulting-group-blog",
  title: "Francois Consulting Group Blog",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
