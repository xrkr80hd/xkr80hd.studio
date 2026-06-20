# Completed Work

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
