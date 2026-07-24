import {defineField, defineType} from "sanity";

export const authorType = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Biography",
      type: "text",
      rows: 5,
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
    defineField({
      name: "avatarUrl",
      title: "Avatar URL",
      type: "url",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "slug.current",
    },
  },
});
