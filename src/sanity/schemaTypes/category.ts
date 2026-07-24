import {defineField, defineType} from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "wordpressId",
      title: "WordPress ID",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sourceUrl",
      title: "Source URL",
      type: "url",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
    },
  },
});
