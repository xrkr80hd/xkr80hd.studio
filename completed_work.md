# Completed Work

## 2026-06-28

- Moved the shared public blog-channel avatar overlay to the right side of the cover image for every channel.
- Reduced the desktop and mobile avatar overlay size so it does not cover channel title artwork.
- Added one shared public directory control strip for A-Z, Z-A, category sort, and category filtering.
- Applied the shared controls below the heroes on Legends, Scene, Artists, Blog, and Podcast.
- Kept each page's own category source: band and artist genre, podcast topic, and blog channel category.
- Corrected the public listing regression after agent review: restored the Blog listing exactly to its pre-change source and moved the non-blog one-column rule after the legacy auto-fill grid so each card spans the full available width.
- Added exact-source and final-cascade regression coverage so the Blog cannot inherit the shared directory wrapper and the remaining public directories cannot collapse into boxed multi-column cards.
- Kept the Blog listing in its established dedicated layout while standardizing Legends, Scene, Artists, Podcasts, and Business with compact full-width horizontal cards.
- Kept Blog channel artwork at 16:9 and changed all other category-card artwork to 1:1, including matching admin upload guidance.
- Kept the shared cards horizontal on mobile with compact, clamped copy instead of tall stacked containers.
- Added podcast descriptions and public business controls for A-Z, Z-A, category ordering, and category filtering.
- Preserved the existing ownership model: Blog remains multi-user while all other curated categories remain owner-managed.
- Verified 19/19 focused tests and a production build generating 50/50 pages.
- Traced the false avatar-save state to invalid signed-upload replacement keys that omitted the required `images/blog-channels/` storage prefix.
- Corrected the shared avatar and cover upload paths for the owner, Jessie, and every current or future blogger profile.
- Kept the crop dialog open on failures and made a successful avatar save persist the channel record before closing and confirming success.
- Made the admin profile editor return the same effective saved-or-fallback cover image served by the public channel.
- Verified 11/11 focused regression tests and a production build generating 50/50 pages.

## 2026-06-27

- Added one shared 1:1 blog-avatar cropper for the owner, Jessie, and every future blogger.
- Added drag positioning, keyboard arrow positioning, 1x–3x zoom, Cancel, Escape, backdrop close, and Crop & Upload controls.
- Cropped avatars export as 1000×1000 JPEG files and continue through the existing authenticated, username-scoped blog-channel upload path.
- Kept homepage profile settings fully disconnected from blog avatar uploads; the cropper never reads or writes `/api/admin/site-profile`.
- Preserved the direct 16:9 cover upload flow and the shared `/assets/cards/local-blog.png` fallback for channels without saved avatars.
- Added seven crop geometry, wiring, accessibility, isolation, and cover-flow tests; verified the complete 23/23 test suite and a 50/50-page production build.
- Moved each displayed blog channel owner's 1:1 profile picture from the separate title bar onto the upper-left of that channel's cover photo.
- Kept the shared template data-driven through `channel.avatar_url`, so every current and future blogger automatically receives the same layout with their own image.
- Constrained the desktop overlay to a 3% left inset and at most 22% cover width; mobile uses at most 24%, keeping the entire square safely left of the vertical midpoint.
- Added regression coverage for hero placement and the strict left-half sizing rule.
- Verified 15/15 relevant tests, a production build generating 50/50 static pages, and HTTP 200 from the running production server on port 3000.
- Corrected the shared blogger template so a blank channel avatar uses the same default profile image shown in the Blog Profile editor, regardless of whether the blogger is the owner or a scoped user.
- Confirmed the owner channel now renders `/assets/cards/local-blog.png` as its avatar while Jessie's channel continues rendering his saved `blog-profile-jessie_v.png` avatar; cover images remain independent.
- Rebuilt the production app, restarted port 3000, and verified 16/16 relevant tests.

## 2026-06-20

- Redesigned Manage Users with compact desktop and mobile cards.
- Added **Add User**, **Existing Admin Users**, and role-grouped **Existing Users** accordions.
- Listed secure environment accounts such as `jessie_v` under **Existing Users → Blogs** without exposing passwords.
- Kept the owner as the sole full administrator and all non-owner accounts blog-only.
- Prevented Add User from duplicating an existing secure environment username.
- Verified 8 unit tests, a 49/49-page production build, and desktop/mobile browser layouts with no console errors.
- Added invisible GA4 visitor tracking with measurement ID `G-3ZHD6MN490`.
- Limited tracking to public pages; `/admin` and all nested admin routes are excluded.
- Added explicit Next.js page-view tracking without any visible badge, widget, or counter.
- Verified two route-policy tests pass and the production build generates 49/49 static pages.
- Confirmed the tracker appears on `/` and is absent from `/admin`.
- Published the analytics-only commit `14fd9cb` to `origin/main`.
- Separated public-site changes from the unfinished blog editor work.
- Kept `AdminBlogCrudForm.jsx` and editor-only `globals.css` rules out of the staged publish.
- Verified the exact staged site state with `npm run build` (47/47 static pages generated).
- Published commit `3b69d7e` to `origin/main`.

## 2026-06-21

- Stopped the stale Next.js server on port 3000.
- Diagnosed stale `.next` output: `webpack-runtime.js` requested `server/9380.js` while the chunk existed under `server/chunks/9380.js`.
- Removed `.next` and completed a clean production build with 50/50 static pages generated.
- Restarted the production server at `http://localhost:3000`.
- Verified `/admin/blog` redirects normally to its protected login page and no longer displays the missing-chunk server error.
- Reproduced the `xrkr80hdblog` public hero incorrectly using the generic `/assets/cards/local-blog.png` fallback.
- Traced the fallback to the missing live `blog_channels` table, which prevents the admin cover URL from persisting.
- Added the exact 1672×941 `xrkr80hd_blog.png` artwork as `/assets/blog/xrkr80hdblog.png`.
- Mapped only the owner blog channel to that dedicated hero fallback while preserving normal behavior for other channels.
- Added a route regression test and verified 9/9 tests, a 50/50-page production build, and the corrected hero in the browser.
- Redesigned the public blog channel hero as a centered, contained 16:9 image with a 900px maximum width.
- Reduced the cover image to 72% opacity and added a restrained overlay so the artwork remains visible without overpowering channel text.
- Placed the channel label, title, description, breadcrumbs, and back button in a compact translucent panel on the left.
- Added a condensed mobile hero treatment and verified desktop and 390px-wide layouts.
- Re-verified 9/9 tests and a production build generating 50/50 static pages.
- Corrected the channel hero after visual review: removed the large information panel, Channel Feed label, description, and breadcrumbs.
- Reduced the hero to a 720px-wide 16:9 image and retained only two small top-left controls: the channel title and Back to Blog Channels.
- Added a regression test for the minimal hero content and verified 10/10 tests plus a 50/50-page production build.
- Built Task 1’s reusable blogger provisioning system around one shared `blog_channels` table with one isolated row per username.
- Added deterministic blank channel defaults; Jessie’s template resolves to username `jessie_v`, channel name `jessievblog`, and slug `jessievblog`.
- Updated new blogger account creation to provision its channel atomically and roll back the account if the required channel lane fails.
- Added a generated Supabase migration that creates and secures `blog_channels`, adds the missing `blog_posts.author_username` ownership column, backfills existing posts to the owner, and seeds all existing blogger accounts including Jessie.
- Verified 13/13 relevant tests and a production build generating 50/50 static pages.
- Confirmed the live Supabase project still requires the migration; the locally authenticated Supabase account was denied project privileges for `goufiujqycnkvewkvegq`.
- Fixed the public blog channel cards at mobile widths by replacing the ineffective flex override with an explicit one-column grid.
- Stacked each post as image, channel label, title, excerpt, and compact action buttons; removed the squeezed text strip and oversized empty card area.
- Verified the corrected layout at 390×844, all 13 relevant tests, and a 50/50-page production build.
- Applied the shared blogger schema to live Supabase and confirmed Jessie received channel row `jessie_v` / `jessievblog`.
- Verified Jessie’s public channel returns HTTP 200 and username-scoped post queries work without schema errors.
- Verified both `avatar_url` and `card_image_url` through reversible database and live application API write/read/restore checks.
- Confirmed no prior Jessie image objects exist in Supabase Storage; the old UI had displayed temporary local previews, so his profile and cover images require one fresh upload now that persistence is available.

## 2026-10-02 — Lets Gleaux campaign
- Built /lets-gleaux with isolated pink/chrome styling, supplied player skin, controls below the frame, download section, and Call Trav NextDocs link.
- Added owner-only /admin/gleaux with separate streaming and download uploads and campaign settings.
- Applied gleaux_campaign schema to YourLocal Supabase: dedicated private audio bucket, server-only settings/events tables, and deduplicated download-request tracking.
- Verified production build, diff formatting, RLS and grants, and transactional download-event deduplication (test rolled back).
- Seven existing test files passed; blog-channel-hero requires a running localhost server and was not verified. Mobile visual and end-to-end audio upload checks remain pending. No campaign audio has been supplied.
- User requested publishing the current build and standing by.

- Follow-up: user requested the player first; download card/button are withheld until their supplied card is ready. Admin upload and download backend remain available.

## 2026-10-03 — CALL TRAV automotive card
- Replaced the generic creator/music promo with the user's full, unmodified CALL TRAV artwork and automotive-specific copy.
- CTA: “Visit Trav’s digital business card,” linking to https://nextdocs.xrkr80hd.studio/card/trav.
- Preserved the supplied branding and phone number; pink/chrome surrounding card adapts to mobile.
- Production build and git diff checks passed.

## 2026-10-03 — Radio display and playback correction
- Matched HomeTracksPlayer's digital artist/title, elapsed/total clocks and progress inside the supplied skin opening, using pink scanline styling.
- Display is absent on idle, pause, stop and ended; play/pause, stop and volume stay below the frame.
- Verified live private bucket and both uploaded MP3 objects exist. Database has the player path, but deployed stream endpoint returned a stale 'Track coming soon' response.
- Added an explicitly uncached Supabase client for campaign reads so uploads are visible immediately, and surfaced playback errors instead of hiding them behind a generic message.
- Production compilation and diff checks passed. Browser state checks were unavailable because the runtime browser binary is missing.

## Gleaux download artwork
Added original hero artwork and functional pink image download button below player; preserved counted download endpoint. Removed side ribbon, corrected presenter credits in defaults, metadata and live settings; made mobile button separate below artwork for a usable touch target. Production build and git diff --check passed. Local browser installation failed (truncated browser download); live visual check follows publishing.

## 2026-10-03 — Gleaux artwork and Trav layout change record
- Added supplied download hero, unchanged, below the radio player and controls.
- Added supplied pink/chrome download button beneath hero lettering; connected existing counted-download handler. On narrow screens the button sits below the artwork for a usable touch target.
- Retained download availability, preparing state, success/error announcements, and download count.
- Corrected above-player credit, metadata, fallback settings, and live Supabase description to: “The track inspired by the Gleaux for the Girls event. Presented By Christus Cabrini and Walker Toyota.” Existing audio paths were preserved.
- Removed the ribbon SVG and its style rules. Contained decorative background and added responsive width safeguards.
- Kept Call Trav below free download. Refined it into one container with two equal 3:4 panels: original calling-card artwork on left, centered vehicle headline/copy and digital-business-card CTA on right. Reference screenshot used only for layout; no screenshot artwork substituted.
- Preserved full original calling-card art with contain sizing and no cropping; preserved Nextdocs link https://nextdocs.xrkr80hd.studio/card/trav.
- Narrow screens stack the two panels to retain readable text and usable controls.
- Verification: production build passed for both revisions; git diff --check passed. Browser installation failed due to a truncated download, so mobile visual verification remains outstanding.
- Publish status: local changes committed; GitHub create_commit returned “user rejected MCP tool call.” Main was not updated and these layout changes are NOT live. GitHub blobs/tree creation alone did not publish. Live Supabase presenter description update did succeed.

## Compact mobile and pink radio correction
Kept automotive panels side by side at phone widths with proportional copy; reduced hero/control spacing; prevented GLEAUX word splitting. Moved seek bar below radio skin, retained elapsed/total digital clock and track title inside opening during playback. Display uses pink lettering on black with pink scanlines, with no blue styling. User supplied blue player is functional reference only. Build verification recorded after completion.
Production build and git diff --check passed for the compact correction.

## Admin-only download count
Removed count from public download card, public page data and download API response. Kept successful download event logging and owner-only admin count. Production build and diff check passed.

## Radio readability
Increased rendered radio height by 18% without changing original asset. Explicit content-sized rows and 1.3 line-height prevent title row compression; brighter pink text and softer scanline overlay improve clarity. Seek bar remains below radio. Production build and diff check passed.

## Event links and Toyota raffle
Added compact Cabrini signup and Walker Gleaux background links between download and business card. Cabrini current official navigation points to https://fundraise.givesmart.com/vf/GLEAUX; Walker dedicated page is a 2020 archive and labeled history. Below business card added supplied Toyota video, muted/autoplay/loop/inline with controls, optimized to 960px H264 (~2.1MB), plus WIN THIS TOYOTA CTA to user-supplied https://www.walker-toyota.com/. No registration transaction performed. Build and diff check passed.

Final event-link correction: replaced Walker archive link with user-provided https://www.facebook.com/share/p/1DLRkizfik/ and pink Facebook SVG icon; retained Cabrini signup beside it above Trav card.
