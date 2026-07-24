import {defineArrayMember, defineField, defineType} from "sanity";

export const blogPostType = defineType({
  name: "blogPost",
  title: "Blog Post",
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "originalModifiedAt",
      title: "Original modified at",
      type: "datetime",
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{type: "author"}],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{type: "category"}],
        }),
      ],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{type: "tag"}],
        }),
      ],
    }),
    defineField({
      name: "mainImage",
      title: "Featured image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
        }),
        defineField({
          name: "caption",
          title: "Caption",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "originalUrl",
          title: "Original URL",
          type: "url",
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        defineArrayMember({type: "block"}),
        defineArrayMember({
          type: "image",
          options: {hotspot: true},
          fields: [
            defineField({
              name: "layout",
              title: "Layout",
              type: "string",
              options: {
                list: [
                  {title: "Float left", value: "floatLeft"},
                  {title: "Float right", value: "floatRight"},
                  {title: "Image with text on right", value: "mediaTextLeft"},
                  {title: "Image with text on left", value: "mediaTextRight"},
                  {title: "Center", value: "center"},
                  {title: "Block", value: "block"},
                  {title: "Full", value: "full"},
                ],
              },
            }),
            defineField({
              name: "alignment",
              title: "Alignment",
              type: "string",
              options: {
                list: [
                  {title: "Left", value: "left"},
                  {title: "Center", value: "center"},
                  {title: "Right", value: "right"},
                  {title: "None", value: "none"},
                  {title: "Full", value: "full"},
                ],
                layout: "radio",
              },
            }),
            defineField({
              name: "size",
              title: "Display size",
              type: "string",
              options: {
                list: [
                  {title: "Small", value: "small"},
                  {title: "Medium", value: "medium"},
                  {title: "Large", value: "large"},
                  {title: "Full", value: "full"},
                ],
                layout: "radio",
              },
            }),
            defineField({
              name: "displayWidth",
              title: "Display width",
              type: "number",
              description: "Desktop display width in pixels.",
              validation: (rule) => rule.min(80).max(1400),
            }),
            defineField({
              name: "displayHeight",
              title: "Display height",
              type: "number",
              description: "Desktop display height in pixels, when known.",
              validation: (rule) => rule.min(80).max(1400),
            }),
            defineField({
              name: "aspectRatio",
              title: "Aspect ratio",
              type: "number",
              readOnly: true,
              hidden: true,
            }),
            defineField({
              name: "originalWidth",
              title: "Legacy display width",
              type: "number",
              readOnly: true,
              hidden: true,
            }),
            defineField({
              name: "originalHeight",
              title: "Legacy display height",
              type: "number",
              readOnly: true,
              hidden: true,
            }),
            defineField({
              name: "wordpressClasses",
              title: "WordPress classes",
              type: "array",
              of: [{type: "string"}],
              readOnly: true,
              hidden: true,
            }),
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "originalUrl",
              title: "Original URL",
              type: "url",
            }),
          ],
        }),
        defineArrayMember({
          name: "layoutBreak",
          title: "Layout break",
          type: "object",
          fields: [
            defineField({
              name: "kind",
              title: "Kind",
              type: "string",
              options: {
                list: [{title: "Clear floats", value: "clearBoth"}],
              },
            }),
          ],
          preview: {
            prepare: () => ({title: "Layout break"}),
          },
        }),
        defineArrayMember({type: "externalEmbed"}),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seoTitle",
      title: "SEO title",
      type: "string",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "originalWordpressUrl",
      title: "Original WordPress URL",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "wordpressId",
      title: "WordPress ID",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "migrationSource",
      title: "Migration source",
      type: "object",
      fields: [
        defineField({
          name: "system",
          title: "System",
          type: "string",
        }),
        defineField({
          name: "contentType",
          title: "Content type",
          type: "string",
        }),
        defineField({
          name: "migratedAt",
          title: "Migrated at",
          type: "datetime",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "publishedAt",
      media: "mainImage",
    },
  },
  orderings: [
    {
      title: "Published descending",
      name: "publishedDesc",
      by: [{field: "publishedAt", direction: "desc"}],
    },
  ],
});
