# Completed Work

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
