import {defineConfig} from "sanity";
import {structureTool, type StructureResolver} from "sanity/structure";
import {schemaTypes} from "./src/sanity/schemaTypes";

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset =
  process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.documentTypeListItem("summitPaymentRecord").title("Summit Orders"),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== "summitPaymentRecord",
      ),
    ]);

export default defineConfig({
  name: "francois-consulting-group-blog",
  title: "Francois Consulting Group Blog",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [structureTool({structure})],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (previous, context) =>
      context.schemaType === "summitPaymentRecord"
        ? previous.filter((action) => !["delete", "duplicate", "unpublish"].includes(action.action ?? ""))
        : previous,
  },
});
