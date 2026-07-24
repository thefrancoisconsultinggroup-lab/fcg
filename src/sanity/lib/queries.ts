import groq from "groq";

const blogPostSummaryFields = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  mainImage{
    alt,
    caption,
    originalUrl,
    asset->{
      url,
      metadata {
        dimensions
      }
    }
  },
  categories[]->{
    _id,
    title,
    "slug": slug.current
  }
`;

export const blogArchivePageQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc, _createdAt desc, _id asc)[$start...$end] {
    ${blogPostSummaryFields}
  }
`;

export const blogArchiveCountQuery = groq`
  count(*[_type == "blogPost"])
`;

export const blogArchiveQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc, _createdAt desc, _id asc) {
    ${blogPostSummaryFields}
  }
`;

export const blogCategoryQuery = groq`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current
  }
`;

export const blogPostSlugsQuery = groq`
  *[_type == "blogPost" && defined(slug.current)][].slug.current
`;

export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0]{
    ${blogPostSummaryFields},
    seoTitle,
    seoDescription,
    originalWordpressUrl,
    originalModifiedAt,
    mainImage{
      alt,
      caption,
      originalUrl,
      asset->{
        url,
        metadata {
          dimensions
        }
      }
    },
    author->{
      name,
      "slug": slug.current,
      bio
    },
    categories[]->{
      _id,
      title,
      "slug": slug.current
    },
    body[]{
      ...,
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          href
        }
      },
      _type == "image" => {
        ...,
        layout,
        alignment,
        size,
        displayWidth,
        displayHeight,
        aspectRatio,
        originalWidth,
        originalHeight,
        wordpressClasses,
        asset->{
          url,
          metadata {
            dimensions
          }
        }
      },
      _type == "layoutBreak" => {
        ...,
        kind
      }
    }
  }
`;

export const relatedBlogPostsQuery = groq`
  *[_type == "blogPost" && slug.current != $slug] | order(publishedAt desc, _createdAt desc, _id asc)[0...3] {
    ${blogPostSummaryFields}
  }
`;
