import {authorType} from "@/sanity/schemaTypes/author";
import {blogPostType} from "@/sanity/schemaTypes/blog-post";
import {categoryType} from "@/sanity/schemaTypes/category";
import {externalEmbedType} from "@/sanity/schemaTypes/external-embed";
import {tagType} from "@/sanity/schemaTypes/tag";

export const schemaTypes = [
  blogPostType,
  authorType,
  categoryType,
  tagType,
  externalEmbedType,
];
