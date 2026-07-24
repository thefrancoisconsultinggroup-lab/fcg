# Media Migration Report

Generated during the Next.js migration audit.

## Download Summary

- Downloaded/publicly migrated assets retained: 53
- Total retained migrated media size: 24,518,364 bytes (23.38 MB)
- Retained files larger than 10 MB: 0
- Deferred large production video sources: 5

Large production video copies were not retained when they duplicated existing user-provided local videos or were unsuitable for immediate static use. Their source URLs remain recorded in `migration/media-manifest.json` under `deferredVideoSources`.

## Hero Asset Selections

- Home: existing user-provided `/assets/videos/home-hero.mp4`
- About Us: CSS atmospheric fallback; no reliable production hero asset selected
- Faith: CSS atmospheric fallback; source page images downloaded for review
- Programs & Services: CSS atmospheric fallback; programme images downloaded for content sections
- Integrated Leadership and Corporate Wellness Team: CSS atmospheric fallback; portraits downloaded for team content
- Neumi Wellness: existing user-provided `/assets/videos/neumi-wellness-hero.mp4`; WordPress image candidate also downloaded at `/assets/migrated/neumi-wellness/neumi-wellness-hero-neumi-skin.webp`
- Thrive Weekly: existing user-provided `/assets/videos/thrive-weekly-hero.mp4`
- Contact: CSS atmospheric fallback; production page references an error video not suitable as a contact hero

## Logo And Brand Marks

Downloaded candidates:

- `/assets/migrated/shared/brand-francois-logo.png`
- `/assets/migrated/shared/brand-cropped-francois-logo.png`
- `/assets/migrated/shared/brand-american-brain-council-banner-logo-500x275-1.jpg`
- `/assets/migrated/shared/brand-power10-logo-v8-scaled.webp`

The header continues using the text wordmark until the best logo usage is confirmed.

## Large Or Deferred Video Sources

Five production video sources were recorded but not retained as migrated duplicates. Existing local project videos remain the preferred source for current heroes.

## Duplicate Audit

Exact hash duplicate groups are recorded in `migration/media-manifest.json`. No retained migrated file exceeds 10 MB after pruning.
