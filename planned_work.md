# Planned Work

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
