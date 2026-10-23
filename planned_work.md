# Planned Work

## Composer speed presets and action description · 2026-10-17

- Add optional Inspired by world context (FF6, StarTropics or custom), scoped to mood rather than replacement asset designs.
- Add broad grouped terrain/architecture families, stackable terrain/architecture/weather/effect details, creative architectural choices and a Write here fallback.
- Replace camera/environment/lighting text-only controls with preloaded, mobile-friendly dropdowns and a Custom option that preserves existing values.
- Add an optional scene-action description to the shared prompt/JSON compiler and saved configurations, retaining compatibility with earlier compositions.
- Keep anchor enforcement, grades and other pages unchanged; verify presets, legacy saves, action persistence, exports and production build before release.

## XCE_COMPOSER additive local implementation (2026-10-17)

- Inspect and reuse owner authentication, project manifests, immutable references, grade library, local image components and shot list structures.
- Add a visual composer, strict approved-reference compiler, verified media packaging, versioned project compositions/intelligence notes, authenticated API and preparatory plugin interface.
- Test directive injection, relationships, missing/foreign anchors, media byte validation, revision conflicts and existing-module regression.
- User authorized testing and production push on 2026-10-17 after the local implementation. Release only to the verified XSTUDIO production branch codex/xstudio-private.

## Blog channel avatar right-side overlay

- [x] Use the agent system to audit the shared public blog channel hero overlay.
- [x] Move the 1:1 channel avatar from the left side of the cover image to the right side.
- [x] Reduce the avatar size on desktop and mobile so it does not cover hero artwork/title areas.
- [ ] Verify focused tests, production build, and local server output.

## Public page sort and category controls

- [x] Use the agent system to audit the public listing pages and the existing Business controls.
- [x] Add shared A-Z, Z-A, and category filtering controls below the heroes for Legends, Scene, Artists, Blog, and Podcast.
- [x] Preserve the approved card layouts while changing only the listing controls/data flow.
- [x] Verify focused listing tests, production build, and local server output.

## Correct public listing grid regression

- [x] Use the agent system to trace the boxed cards to the legacy auto-fill grid overriding the shared one-column rule.
- [x] Restore `/blog` byte-for-byte to its pre-shared-card source from commit `4771150`.
- [x] Force every non-blog public listing to one full-width horizontal card per row.
- [x] Add regression tests for exact Blog restoration and final CSS cascade authority.
- [x] Verify the production build and push the correction to `main`.

## Compact mobile public cards

- [x] Preserve the approved desktop Blog Channels layout.
- [x] Shrink Blog Channels cards only at mobile/narrow widths so they stay compact instead of becoming tall stacked billboards.
- [x] Keep shared owner-managed public listing cards compact on mobile.
- [x] Add regression coverage for the mobile-only card sizing contract.
- [x] Verify focused tests and the production build.

## Standardize top-level public listing cards

- [x] Inventory Blog, Legends, Scene, Artists, Podcasts, and Business through the workspace agent system.
- [x] Define one compact horizontal card contract with 16:9 blog media and 1:1 media everywhere else.
- [x] Add regression tests for ratios, mobile horizontal layout, podcast descriptions, and business sorting.
- [x] Implement the shared cards and business A-Z/Z-A/category controls.
- [x] Verify tests and the production build.
- [x] Push all completed changes directly to `main`.

## Fix permanent blog avatar persistence

- [x] Trace the admin crop-save request through signed storage, the channel API, Supabase, and the public channel.
- [x] Correct the shared upload replacement key so every blogger avatar is written under the permitted blog-channel storage folder.
- [x] Return the effective saved-or-fallback cover image consistently in the admin profile editor.
- [x] Verify the focused regression tests and production build.
- [ ] Commit all current changes and push them directly to `main`.

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

## 2026-10-02 — Lets Gleaux campaign page
- Add /lets-gleaux after Home with pink navigation accent and isolated CSS.
- Use supplied pink/chrome player skin, live display, and controls below the frame.
- Add owner-only /admin/gleaux with separate player/download uploads and campaign copy.
- Isolate audio in a dedicated private bucket; track download requests server-side with retry deduplication.
- Add Call Trav / NextDocs preview card; verify build, authorization, responsive layout, and database before publishing to main.

## 2026-10-03 — CALL TRAV automotive card
- Replace the generic music/creator card with the supplied CALL TRAV artwork, preserved in full.
- Use automotive sales copy and a clear digital business card CTA linking to NextDocs, in the page's pink/chrome theme.

## 2026-10-03 — Match homepage radio display
- Inspect HomeTracksPlayer and use its digital artist/title, clock, and progress treatment inside the Gleaux skin opening.
- Keep the opening blank whenever audio is not playing; transport and volume remain below the frame.

## Gleaux download artwork
Add supplied hero and download button below player; correct event presenter credit; remove side ribbon and fix responsive overflow. Verify build and publish.

## Trav two-panel refinement
Use reference for clean equal 3:4 panels in one container under free download, original artwork left and centered automotive copy right.

## Compact mobile correction
Keep Trav panels side by side on mobile, prevent GLEAUX word wrapping, reduce mobile whitespace, and separate pink in-radio digital readout from below-radio seek bar.

## Admin-only download count
Remove count from public UI, server props and public download response; retain event tracking and owner admin count.

## Radio readability
Slightly increase rendered radio height and prevent digital text rows from shrinking/clipping; soften scanlines.

## Event links and Toyota raffle
Add Cabrini signup and Walker event-background links above business card; muted looping supplied Toyota video and supplied Walker Toyota CTA below business card. Optimize web video without altering composition.

Use user-supplied Facebook event post instead of historical Walker event page; add pink Facebook icon.

## Admin play tracking
Count successful playback starts with per-play UUIDs; repeat browsers allowed; resume/buffering deduplicated; stop/end resets. Private RLS-protected events and owner-only admin total. Preserve download behavior and existing page content.


# Ultimate Game Night

Confirmed scope: integrate /game-night into existing xrkr80hd.studio Next/Vercel project; owner-created Game Master accounts, per-host private cloud saves, public guest QR join; teams and rotating representatives; private host popout; simple picture crop and permitted music clues. Save checkpoints to Git. Deploy validated main commits through connected Vercel Git integration.

After secure hosting: agent-assisted live TV redesign and AI tools with host review. Test mobile, desktop, 1980 × 1020 and 3840 × 2160 and provide screenshots. Simulate viewport/pixel readability; physical 55/85-inch TV distance checks require the user's actual screens.

Agents: security_review (server isolation), show_design (visual direction/CSS), game_qa (game flow and resolution checks). Root handles integration, media and AI.

## Ultimate Game Night security agent
Review Game Master sessions, private room isolation and server routes. Bind host cookies to current credentials so password resets revoke prior sessions; test tampering, expiry and credential changes.

## Ultimate Game Night broadcast design
- Confirmed CSS scope: cobalt/gold live game show treatment, viewport-scaled TV board at 1980×1020 and 3840×2160, clear phone turns and host controls. Design agent edits style.css and design notes only; root owns markup and deployment.

## Ultimate Game Night AI agent
Implement authenticated, origin-checked AI draft endpoint with server-only provider key and durable request limits. Add deterministic content checks and review-before-apply dialog. No provider calls without configured key; no paid verification calls.

## Existing master account correction
User confirmed xrkr80hdadmin (existing site admin, display name Travis). Map Game Night owner to this exact existing account; validate its existing password; site login grants signed Game Night access, with password-change/disabled-account revocation. Do not create a duplicate account or alter its password.

- Add contextual Game Master next-action prompts and an eight-step walkthrough; preserve online room during popout despite cloud save conflicts; verify and publish.
# XSTUDIO private app and Fuschia integration (2026-10-16)

## XSTUDIO migrated library access (2026-10-17)

- Make every migrated asset reachable in the owner library instead of silently stopping at 100 records. Preserve owner authorization and use bounded, stable pages; verify the build and owner interface.


- [x] Build a separate private XSTUDIO app from the installed XSTUDIO plugin's rules, scripts, templates, and assets; leave the live studio app and WAMarket unchanged.
- [x] Add Fuschia Light House XSTUDIO-only data and private storage with verified owner identity and row-level access.
- [x] Add authenticated asset upload/download and scoped external-tool ingress, plus provider integrations only where official APIs and credentials are verified.
- [x] Verify local build and security checks, production deployment, authoritative and public DNS, HTTPS, and anonymous access boundaries at `xstudio.xrkr80hd.studio`.
- [x] Record actual results, missing credentials or account access, and any remaining steps in `completed_work.md`.
- [ ] Verify owner sign-in, an authorized asset upload/download, and owner token management with a live owner session.

## XSTUDIO owner password recovery (2026-10-16)

- [x] Add a same-browser Supabase password recovery request for the existing owner account.
- [x] Exchange only a recovery code server-side, verify owner identity, and require a signed grant tied to that session for the password form and update endpoint.
- [x] Run focused tests and a production build; document the required redirect allow-list entry.

## 2026-10-17 XCE interface restoration
- Restore the original project/workspace/asset/shot interface on xstudio.xrkr80hd.studio, private inline previews, strict project anchor binding, cached offline browsing, global list/grid controls, separate Rules, and touch controls. Preserve Supabase owner authentication and the existing connector.

## Thumbnail and navigation repair (2026-10-17)
- Fix previews resolving asset IDs ahead of attached reference images; add regression checks.
- Add persistent Back and Overview / Project / Current page breadcrumbs above studio headings, including the asset library.

## Character cast organization (2026-10-17)
- Add Main, Supporting, Background and Unsorted cast accordions only within Characters.
- Persist organizational grouping independently of locked visual records, with owner/folder checks and revision conflicts.
- Verify group changes preserve codes, images and approvals; publish the update.

## CGE profile storage and editing (2026-10-17)
- Add canonical profile import/staging, explicit custom saving, editable parameters, export and versioned owner-session API routes.
- Preserve seven factory definitions, existing custom grades, assignment snapshots, reference links and original CGE tokens.
- Verify round-trip, edit conflicts and preservation, then publish the complete update.

## Asset sorting and character details (2026-10-18)
- Presort live, unlinked references using original names and inspected sheets; preserve existing links, codes, locked records and deletions. Unresolved references go to Lost Assets.
- Move cast assignment off library tiles into an explicit choice dialog inside asset details; simplify the mobile details view and hide generic character prompts and background color samples.
- Verify core data invariants, cast API behavior, responsive styles and build before publishing.

## Delete confirmation checkbox layout (2026-10-18)
- Put the linked-record checkbox after its sentence on the same row, with wrapping text and a fixed-size checkbox on mobile. Preserve deletion behavior. Check and publish.

- Investigate Rosa cast save failure: resolve project-local character/reference aliases to the canonical saved character ID; reject ambiguous, missing, foreign and creature records. Preserve character/image data.
- Reuse NEXTDOCS cropper image/export approach for face/body anchors; add movable edge/corner selection, square start and optional square lock, saved-image/device sources and separate non-destructive crop files. Verify geometry, attachment pool, cast behavior and production build; hold commit/push pending review.


## 2026-10-18 — Unsaved carousel character save
Trace the reported Kutan save error; preserve reference identity in the inspector and route unsaved image organization through asset intake, with destination selection. Verify locally; no commit, push or deployment.


## 2026-10-18 — Alternate form reference pool
Replace the empty project-image dropdown with a searchable thumbnail picker across available asset pools. Do not require private storage keys in public manifests; import a selected cross-project reference before assigning it. Preserve existing local carousel fixes.


## 2026-10-18 — Stable asset rename and consumed upload cards
Reproduced Name & Save leaving a presorted source upload visible after reference normalization, because the browser manifest omits storage keys. Use reference lineage/attachment IDs to hide consumed upload cards. Route a reference already owned by a single saved legacy asset to that existing editor, and retain stable IDs and lock on name-only updates. Verify without deleting historical data or pushing.


## 2026-10-18 — Prop descriptions, character clauses, project builder page
Add user-authored prop descriptions and repeatable character-linked clauses, applied only when both assets are selected in scene prompts. Preserve lock/image identity and validate project scope. Move the embedded Assets project-prompt builder to the dedicated project Composer page. Keep rename fixes local; no push.


## 2026-10-18 — Simple scene inventory and descriptions
Use closed category/cast accordions, name sorting and explicit gender labels. Remove drag/drop and research-profile UI. Show image and human name only; retain approved-only scene eligibility. Add a simple description to saved items and scene prompts, with optional prop-character clauses. Verify all changes locally.


## 2026-10-18 — Missing non-character approval action
Expose the existing owner image-lock workflow for props, creatures/beasts, vehicles and locations. Verify exact saved bytes and project revision, preserve asset identity, and retain explicit approval.


## 2026-10-18 — Unified asset editor and compact menus
Combine saved asset name, category, classification, short description and character sorting in one closed Edit / Rename section. Use dropdown choices, remove picker-only description/research editing, and show descriptions on library cards. Preserve descriptions during asset transfer. User authorized all current fixes and push after verification.

## 2026-10-18 — Categorize the scene-reference character list
Recording identifies SceneCastPicker's uncategorized native select, separate from Composer. Add one role/category dropdown, alphabetical filtered character choices and search; isolate beasts/creatures from cast roles. Retain selected IDs across category changes and remove draft/lock suffixes. Verify and publish this correction within the already authorized simplification work.
Reuse the categorized character picker for prop-character clauses and character relationship clauses, removing the same long mixed dropdown from those editors too. Keep scene choices and existing clause targets intact when browsing another category.

## 2026-10-18 — Restore visible compact inspector buttons
User clarified category dropdowns were not authorization to hide action/copy buttons. Restore visible Edit / Rename, Duplicate, Move, Delete, Copy code and Copy for ChatGPT buttons. Replace oversized Share accordion and saved-asset Edit accordion with compact controls; retain the unified editor behind Edit / Rename. Scope styling to the inspector and keep consistent 44px button height.

## 2026-10-18 — Remove redundant human edit fields
Keep character role and gender in Edit / Rename. Hide its duplicate description for characters and show classification only for props. Retain existing saved text without deleting it; keep the original character details area. Verify rendered character and prop editors. Hold publishing for the user's push instruction.

## 2026-10-18 — Universal viewer arrows and always-on advance
Every asset viewer, regardless of category or native/legacy record type, must show previous/next arrows on the image's left/right edges. Remove both Auto-Next checkboxes and always advance after saves. Keep the last saved asset open until the user closes it. Preserve existing character rule data; the user's “rule” refers to universal viewer navigation.


## 2026-10-18 — Switches for on/off settings
Record the user's build preference and apply switch styling/semantics to clause enable controls, crop square lock and linked-delete option. Preserve item-selection and explicit-approval checkboxes. Retain always-on viewer advance without a toggle. User authorized push after fixes.


## 2026-10-18 — Refresh restores the current project/page
Fix restoreNavigation's unconditional project-picker reset. Restore validated saved page, project, search, scene and scroll; explicit URL targets take priority. Keep the last asset category per project. A locked restored project prompts for its PIN without erasing the desired page/project and returns there after unlocking. Verify and publish with the authorized fixes.


## 2026-10-19 — Compact project identity and working ID edits
Show project title and Project ID as plain text with a compact Edit button underneath. Open an ID field only during editing with Save and Cancel and inline errors. Add an owner-scoped atomic project-key rename preserving assets, codes, active context/order and metadata. Reject conflicts, invalid IDs, stale revisions and system pools; retain the folder PIN gate. Verify locally and hold publication for the user's push instruction.


## 2026-10-19 — Short trash action labels
Label the selection action Delete permanently; preserve disabled-until-selected behavior. Keep Empty trash applying to all trashed items independently of selection and retain the existing confirmation.


## 2026-10-19 — Upload directly into a chosen category
Replace broad upload image types with the actual cast groups and distinct prop/vehicle/creature/location categories. Classify each batch image as selected and create its saved asset and cast assignment in the same manifest write. Preserve existing attach-image editing and Lost Assets intake behavior. Verify category assignments persist through the normal saved-asset library and picker.


## 2026-10-19 — Create Scene Reference starts with category selection
Trace the exact Create Scene Reference cast picker. Load all saved project cast roles and creatures; show all category choices before any character list instead of silently defaulting to Main Characters. Hydration/category changes must not reset already-added cast. Verify villains and background cast can be selected and saved together.

The picker also needs an explicit Back to categories button; returning to categories must preserve all added cast IDs.

### Mobile character picker Back correction
Replace the native character select that obscures category navigation with an inline, bounded list. Keep Categories at the top beside the current category; preserve parent selections. Verify interaction and lint before release.

### Shared viewer centering
Restore explicit auto margins and fixed viewport positioning for native dialogs after Tailwind reset. Preserve desktop drag overrides and full-screen shot modal. Existing Tailwind 4 and lucide dependencies already provide styling/icons; avoid duplicate framework.

## 2026-10-21 Exact character image handoff
Trace exact-code authorization and locked source retrieval; reuse CREF for anchor media; improve discovery guidance and bounded image responses; add regression tests and report client/deployment limits. No production changes or push.
## Asset Library viewer and batch inspection (2026-10-21)
Implement read-only asset inspection before explicit editing for every library category; preserve category navigation; reuse long-press selection and existing batch controller for selected comparison and explicit batch edits. Verify types, regression tests and interaction rendering. No commit, push or deployment.

## Complete preview attributes (2026-10-21)
Show saved relationships and synergies (including disabled rules), equipment and reverse prop links, and gender/core details in the large read-only preview. Publish to the already-authorized branch.

## Compact character preview accordions (2026-10-21)
Keep the large image and viewer controls; collapse attributes, biography, relationships, synergies, equipment, variations and continuity into categorized accordions. Isolate anchor prompts from attributes and group GPT prompt handoff and codes in a separate accordion.

## Mobile asset preview swipe (2026-10-21)
Add horizontal touch swiping across the large asset image, reusing the existing swipe threshold and respecting carousel boundaries, scrolling and pinch gestures. Keep desktop arrows.

## Silhouette choices and clean preview (2026-10-21)
Add silhouette dropdown to character appearance metadata; preserve custom saved values and locked image identity. Remove Material Spec and empty JSON placeholders from preview attributes.

## No preselected project assets (2026-10-21)
Explicit project selection clears active asset, selected items and scene/filter state. Asset library starts with no category selected; user chooses what to browse.

## Cover photo picker (2026-10-21)
Request image/* for project cover selection so mobile browsers can offer their native photo picker. Keep camera capture optional and server image validation intact.

## Cover source selection (2026-10-21)
Offer phone/device or current project assets for a folder cover. Load the selected folder’s manifest, browse categories with nothing preselected and use exact saved image bytes via the existing validated cover upload endpoint.

## XSTUDIO deployment repair (2026-10-23)
Verify the latest main branch after the failed 20b636c deployment, use the checked-in pnpm lockfile for reproducible Vercel installs, and correct local/deployment instructions. Run the production build and relevant checks before publishing.

## Pin production pnpm (2026-10-23)
Select pnpm 11.25.0 explicitly in Vercel install/build commands after production used an incompatible global pnpm when Corepack detection failed.
