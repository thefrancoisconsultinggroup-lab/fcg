import {defineField, defineType} from "sanity";

export const externalEmbedType = defineType({
  name: "externalEmbed",
  title: "External Embed",
  type: "object",
  fields: [
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "provider",
      title: "Provider",
      type: "string",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "url",
    },
    prepare(selection) {
      return {
        title: selection.title || "External embed",
        subtitle: selection.subtitle,
      };
    },
  },
});
