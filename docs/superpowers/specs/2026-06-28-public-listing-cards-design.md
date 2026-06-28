# Public Listing Cards Design

## Scope

Standardize the top-level public category listings for Blog, Local Legends, Local Scene, Artists, Podcasts, and YourLocal Business. Home, Hub, detail pages, and admin screens retain their specialized layouts.

## Card contract

- Every category card stays horizontal at desktop and mobile widths.
- The title is the first item at the top-left of the content area.
- The card height is bounded by the media height; text is clamped so no empty vertical tail or content-driven growth appears.
- Blog channel artwork is 16:9.
- Legends, Scene, Artists, Podcasts, and Business artwork is 1:1.
- Images fill their media region without distorting the card.
- Podcast cards include a short description of the show.

## Business directory controls

The owner-managed business directory supports A-Z, Z-A, and category ordering, plus an optional category filter. Sorting occurs without changing stored admin order or business records.

## Ownership

Blog remains the only multi-user category. All other categories remain curated and managed by the site owner.

## Verification

Source-contract tests cover shared classes, image ratios, horizontal mobile behavior, and podcast copy. Pure helper tests cover business sorting, filtering, category extraction, and input non-mutation. The complete production build is required before publishing.
