# Unresolved Migration Items

- Faith page text could not be reliably extracted because the production page is primarily image-based. Source images are downloaded in `public/assets/migrated/faith/`.
- Home page contains lorem ipsum in the production WordPress content. Placeholder text was not migrated.
- About, Programs and Team content should receive human review for punctuation and wording where WordPress extraction produced replacement question marks or truncated source text.
- Contact page exposes no public email address, phone number, physical address, office hours or social profiles through the audited public page/API.
- Several team biographies appear longer in the source than the safe extracted snippets used in code; review against the live page before final copy polish.
- Five large production video sources were deferred rather than duplicated in `public/assets/migrated`; see `migration/media-manifest.json`.
- No poster images were identified for the user-provided hero videos.
- Thrive Weekly post bodies remain reserved for later Sanity import.
- WordPress tags endpoint returned no public tags.
- Link audit found an empty `#` placeholder link in the WordPress home content.
- No working contact-form backend, newsletter functionality, Sanity schemas or Mux integration has been added.
