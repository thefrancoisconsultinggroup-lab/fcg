# Content Migration Report

Generated during the Next.js migration audit.

## WordPress API Endpoints

- `/wp-json/`: accessible
- `/wp-json/wp/v2/pages`: accessible, 10 pages
- `/wp-json/wp/v2/posts`: accessible, 41 posts
- `/wp-json/wp/v2/categories`: accessible, 6 categories
- `/wp-json/wp/v2/tags`: accessible, 0 tags
- `/wp-json/wp/v2/media`: accessible, 253 media items across 3 API pages
- `/wp-json/wp/v2/users`: accessible, 1 public user

## Regular Pages

- `/`: extracted from WordPress `home-2`; confidence medium. Production page includes reliable "My Why" text but also lorem ipsum placeholder content, which was not migrated.
- `/home-2`: inspected as the same WordPress page as `/`; remains a legacy duplicate and redirects to `/`.
- `/about-us`: extracted; confidence medium. Vision, mission, strategic partner and core values material migrated.
- `/faith`: extraction confidence low. The page is primarily image-based; source images were downloaded for review rather than guessing text.
- `/programs-services`: extracted; confidence medium. Service descriptions and package notes migrated.
- `/integrated-leadership-and-corporate-wellness-team`: extracted; confidence medium. Team names, portraits and reliable visible biographies migrated where available.
- `/neumi-wellness`: extracted; confidence medium. Neumi wellness text and product imagery migrated.
- `/contact`: extracted; confidence medium. Public intro copy migrated. No email, telephone number or address was found through the public page/API.

## Thrive Weekly

The public WordPress API returned 41 posts. Titles, slugs, dates, modified dates, authors, categories, excerpts, featured image URLs and inline media references are recorded in `migration/blog-audit.json`.

Post bodies were not imported into static route files. Thrive Weekly remains reserved for a later Sanity migration.

## Editorial Concerns

- Home includes lorem ipsum in the live WordPress page.
- Faith content appears embedded in images, not reliably machine-readable text.
- Some extracted WordPress text contained replacement question marks where punctuation or special characters appeared in the source; obvious cases were corrected only in code where context was clear.
- Several production videos are large and should move to Mux or another media pipeline later.
