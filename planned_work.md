# Planned Work

## Shared blog avatar cropper

- [x] Keep homepage image data completely separate from blog avatar data.
- [x] Keep the shared man-at-computer asset as a blog-only fallback when no channel avatar is saved.
- [x] Add a reusable 1:1 crop dialog with drag positioning and zoom to the shared Blog Profile editor.
- [x] Upload and save the cropped avatar only to the logged-in blogger's own `blog_channels.avatar_url`.
- [x] Leave the 16:9 cover upload flow unchanged.
- [x] Add crop-geometry and profile-editor regression tests.
- [x] Verify responsive CSS behavior, production build, shared blogger tests, and restart the server.

## Blog channel profile picture overlay

- [x] Move the displayed channel owner's 1:1 profile picture from the separate title bar onto the upper-left of the cover photo.
- [x] Keep the entire profile picture left of the cover photo's vertical center line.
- [x] Preserve the shared per-blogger template so each channel automatically renders its own avatar and cover.
- [x] Add a regression test for the avatar's placement inside the cover hero.
- [x] Verify the focused tests and production build, then start the Node.js server for review.

## Shared blog avatar source correction

- [x] Reproduce the missing owner avatar against the running public channel.
- [x] Use the same default avatar shown by the Blog Profile editor whenever any channel's saved avatar is empty.
- [x] Preserve every blogger's saved channel avatar and leave cover images unchanged.
- [x] Add an end-to-end regression test, rebuild, and restart the server for review.

## Manage Admin Users redesign

- [x] Keep **Existing Admin Users** and show the protected owner account there.
- [x] Add an **Add User** accordion with a Blogs access category.
- [x] Add **Existing Users** with nested category accordions.
- [x] Place database and secure environment accounts such as `jessie_v` under **Blogs**.
- [x] Redesign admin and user cards to be more compact and easier to scan.
- [x] Preserve hashed passwords and owner-only access.
- [x] Test grouping behavior and verify the production build.

## Google Analytics visitor tracking

- [x] Add GA4 measurement ID `G-3ZHD6MN490` to all public pages.
- [x] Exclude `/admin` routes from analytics.
- [x] Test public/admin route selection.
- [x] Verify the production build.
- [x] Publish only the analytics changes without including unrelated local edits.

## Current publish

- [x] Prepare the current public-site changes for `main`.
- [x] Exclude the unfinished blog editor implementation and editor-only styling.
- [x] Verify the staged changes before pushing.
- [x] Push the verified commit to `origin/main`.
- [x] Confirm excluded editor work remains local after the push.

## Clean local rebuild on port 3000

- [x] Stop the current server listening on port 3000.
- [x] Remove the stale `.next` output whose runtime references a missing server chunk.
- [x] Run a clean production build.
- [x] Restart the local app on port 3000.
- [x] Verify `/admin/blog` loads without the missing-chunk server error.

## Blog channel hero image mapping

- [x] Reproduce the incorrect profile picture in the `xrkr80hdblog` channel hero.
- [x] Trace the saved blog cover image from admin settings through the API and public channel loader.
- [x] Add a regression test proving the hero uses the blog cover image rather than the profile image.
- [x] Fix only the channel hero image mapping.
- [x] Rebuild, restart port 3000, and verify the public channel hero in the browser.

## Compact blog channel hero

- [x] Render the channel hero as a contained 16:9 image instead of an oversized first-screen block.
- [x] Place the channel label, title, description, breadcrumbs, and back button in a small translucent panel on the left.
- [x] Keep the first blog post visible near the fold.
- [x] Verify desktop and mobile presentation, tests, and production build.

## Minimal blog channel hero correction

- [x] Remove the oversized channel information panel.
- [x] Remove the Channel Feed label, description, and breadcrumbs.
- [x] Keep only a small title box and a separate Back to Blog Channels button at the top-left.
- [x] Shrink the hero substantially and verify the live layout.

## Task 1 — Jessie reusable blogger profile

- [x] Create the shared `blog_channels` structure used by every blogger.
- [x] Provision Jessie (`jessie_v`, he/him) with his own isolated default channel row.
- [x] Treat Jessie’s blank profile structure—not his personal content—as the reusable blogger template.
- [x] Automatically provision the same channel structure whenever a new blogger user is created.
- [x] Keep each blogger’s profile, drafts, posts, images, and public channel scoped by username.
- [x] Add regression tests for default channel naming and automatic provisioning.
- [x] Verify Jessie’s user-level blog manager and public channel without the missing-table error.
- [x] Run the complete relevant test suite and production build.

## Mobile blog channel post cards

- [x] Replace the squeezed two-column mobile card with a single-column stack.
- [x] Scale the post image, channel label, title, excerpt, and buttons down for small screens.
- [x] Keep the image above the text and eliminate the large empty card area.
- [x] Verify at 390px width and rerun tests and the production build.

## Planned — Blogger profile editor and public profile output

- [ ] Give each blogger a separate **Edit Profile** page or dedicated profile form.
- [ ] Allow the blogger to edit their bio and future approved profile fields without editing the public page directly.
- [ ] Save all profile content to that blogger’s isolated `blog_channels` row.
- [ ] Render the saved bio and profile details near the top of that blogger’s public channel page.
- [ ] Keep profile editing restricted to the signed-in blogger and the owner account.
- [ ] Use Jessie’s profile structure as the reusable staging template for future blogger accounts.
- [ ] Design and approve the public profile output layout before implementation.
- [ ] Add ownership, save, reload, mobile-layout, and public-output tests.
