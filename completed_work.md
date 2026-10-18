## Composer layered worldbuilding presets · 2026-10-17

- Expanded grouped base selections to 415 choices, including 125 terrains and 106 architectural styles (historic, regional, civic, industrial, futuristic and imaginative).
- Added 116 stackable terrain/architecture/weather/element details in compact accordions with per-item removal. Desert + buried ruins + broken walls and overcast + rain + mist are supported without manual prose.
- Added Write here near the top of the main dropdowns, including architecture, with editable text preserving prior custom values. Creative choices include cliff cities, living-tree settlements, crystal palaces, machine complexes, floating temples and other original worldbuilding directions.
- Optional scene_details arrays preserve compatibility with earlier saved compositions. Compiler/preview/JSON/export include the combined details, preserving approved anchor authority. No project/asset/grade records were duplicated or changed.
- Added optional Inspired by world context at the end, with FF6/StarTropics presets and Write here. Prompt instructions borrow mood/world feel only and explicitly preserve approved asset designs and selected rendering style.
- All 81 tests pass, including combined terrain/weather/world parsing, layered save/reopen/ZIP continuity, existing custom/legacy scenes, array limits and existing-module regressions. Production build/type checks pass; signed-in visual/mobile checks remain unavailable in the test browser session.

## Composer dropdown presets and action guidance · 2026-10-17

- Added 228 preloaded choices across 15 fields: terrain, architecture, atmosphere, weather, time of day, lighting direction/quality, camera lens/angle/elevation/distance/framing/composition/movement and overall scene action. Native selects keep mobile interaction familiar; every field offers Custom without erasing existing values.
- Added “What’s happening?” with reusable action descriptions and custom prose. Optional scene_action remains backward compatible with previous saves. New assets follow overall scene action by default; explicit per-asset actions take priority.
- Injected bounded action-enhancement guidance into preview/final prompts and exported JSON: clarify motion, direction, speed, timing and interaction only as needed, preserving intent and approved references; never add new assets/events or override identity locks.
- Preset choices use existing scene configuration fields; no database migrations, approved asset changes or grade changes. Other pages/forms are untouched.
- All 78 tests pass, including preset-to-prompt/JSON compilation, legacy/custom preservation and action/save/reopen/ZIP guardrail retention. Type checking and the clean production build pass. Signed-in browser controls remain unverified because the cloud browser is at owner sign-in.

## XCE_COMPOSER mobile recheck · 2026-10-17

- Rechecked forms, canvas controls, modal focus/close, navigation and narrow-screen wrapping after the user requested a mobile review.
- Set Composer inputs to 16px to avoid iOS focus zoom; maintained 44px touch targets; stacked relation selectors and a two-column wrapping action grid on mobile; used two thumbnail columns below 360px.
- Kept scene nodes within visible canvas bounds, spread initial click-added references across the canvas and made reselecting an asset preserve its placement; made the dialog X sticky with safe-area padding; added a vertical scroll region for the longer desktop sidebar so all existing destinations remain reachable on short windows. Composer form CSS is scoped to its module; no other page forms changed.
- Production release 13e9bd2 reached READY. Live checks: OpenAPI 200, private inventory 401 without sign-in, malformed connector 401, cross-origin/missing-origin POST 403, private Composer redirects to owner login.
- Cloud browser is available but at owner sign-in. Signed-in live drag/touch and actual project save remain unverified; code-level controls, exports, permissions, revisions and existing regressions are covered by the 75 passing tests. Vercel runtime-log access returned 403, so no clean runtime-log claim is made.

# XCE_COMPOSER implementation · 2026-10-17

- Added the native /composer project page and shared navigation entry. Existing and newly created projects resolve their own inventory, grades, shot lists and compositions without initialization writes or a second database.
- Added thumbnail inventory, click/desktop drag placement, mobile long-press selection and position-slider fallback, depth/actions/relationships, simple look controls and advanced accordions, live unverified prompt/JSON preview, server-verified output, copy/save/edit/duplicate and ZIP exports with actual image bytes.
- Added a strict versioned compiler. Exact project assets, LOCKED references and required parents are resolved; current image bytes are downloaded from allowlisted authenticated storage and bounded/hashed. Missing/deleted/foreign/diagnostic/draft anchors fail without substitution. The mandatory XSTUDIO directive is compiler-injected on regenerated and exported outputs. Hash validation proves retrieval, not visual fidelity.
- Compositions, bounded configuration history and staged/reviewed asset intelligence live additively in existing manifests. Existing assets/IDs/grades/anchors are unchanged. Research Asset prepares a source-aware brief; automated online research is not wired to a provider.
- Added owner-session/scoped-token API with CSRF checks, existing folder-lock enforcement, optimistic project/record revisions and save readback. Prepared OpenAPI integration and synchronized JSON schema; no new registered ChatGPT plugin or MCP transport was published.
- Verification: 75 Node tests pass (41 composer tests plus existing regressions); production Next build/type check pass. Browser automation is unavailable in this session, so desktop pointer/mobile touch visual E2E and authenticated live saves are not claimed as tested. No database migration or test records were introduced into production.
- Release authorized by the user after local checks. Production branch and project verified against the current Vercel deployment before pushing.

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

## Admin-only play count — 2026-10-03
Added private gleaux_play_events table, server-only inserts/count reads, and Track plays in owner admin. Browser sends a per-play UUID on actual playing event; same-browser replays count after stop/end, while pauses/resumes/buffering and request retries do not duplicate plays. Tracking failures do not interrupt audio. Public API returns acknowledgment only. Counts start at deployment; historic plays cannot be recovered. Verified two lifecycle tests, transaction-only DB repeat/dedup test (rolled back), production build, diff check, RLS and grants. Supabase advisor reports intentional RLS-without-public-policies for this server-only table; existing unrelated findings unchanged.


# Work checkpoints

Integration source prepared: separate signed Game Master login, server-mediated private workspace saves with optimistic concurrency, owner host management, public phone API, cropped image and permitted music sources. Pending database migration, tests, production deployment.

Existing site verified: xrkr80hd.studio, Vercel studio-production-suite, connected GitHub xrkr80hd/xkr80hd.studio. Supabase goufiujqycnkvewkvegq.

## Ultimate Game Night security agent
Bound host sessions to HMAC fingerprint of current password hash; resetting credentials now invalidates existing host sessions. Disabled hosts remain disabled after password reset. Changed media bucket to private; upload returns 24-hour signed URLs and storage path, workspace load/save refreshes only media under the current host path. Three Node security regression tests pass (session tampering/expiry, credential rotation, private-media owner isolation). Legacy public room Edge bypass identified for root to close.

## Ultimate Game Night broadcast CSS
- Implemented approved cobalt/gold set, TV scaling, live sidebar hooks, wrapping names, phone turn/buzzer treatment, private command-console polish and reduced motion.
- Added docs/game-show-design.md with sizing and validation requirements. Root owns application integration and screenshot verification.

## Ultimate Game Night AI assistant
Added authenticated /api/game-night/ai readiness and draft generation route using server-only OPENAI_API_KEY and configurable model. Enforced origin/session checks, durable request limits, bounded input, timeout, private response caching and strict draft schema. Generation remains visibly disabled when provider key is absent. Added review-before-apply UI module, editable questions/answers/narration, duplicate/ambiguity/length/reference checks and transparent rule-based difficulty suggestions. Input excludes media and private credentials. Tested validation and deterministic checks with no provider calls. Root integrates hook and performs build/deploy.

## Ultimate Game Night publication verification
Applied private game tables/storage and owner isolation migration; closed legacy Edge access for account-owned rooms. Passed production Next build, 14 engine checks, signed-session/media tests, AI draft checks, and live phone/team/rotation/wager privacy integration. Public browser QA passed 16 viewport/phase scenarios across 390×844, 1440×900, 1980×1020 and3840×2160; screenshots recorded. Actual physical55/85-inch viewing distance remains user hardware verification. AI draft backend and reviewed apply UI available; provider generation awaits OPENAI_API_KEY. No paid AI provider calls performed.

Production commit a19133e reached Vercel READY and custom domain. Live checks: host route redirects to login, workspace denies anonymous requests, player/TV routes and game assets return200. Final browser flow includes phone join/team/pick/buzz, host correct/undo, picture crop/save, and all six-team ten-player TV phases without clipping. Fixed history/Join navigation to keep /game-night despite assets base URL. Screenshot fixtures are simulations; physical TVs not available.

## Existing site master reused for Game Night
Confirmed user screenshot and enabled admin_users record xrkr80hdadmin (Travis). Game owner configuration corrected to that account. Game login validates its existing site credentials; regular site login also issues signed Game Night session. Site authorization, account record and password unchanged. Game token binds to current admin password hash and is revoked if account disabled/password changed. Regression verifies Game Night lookup failure cannot interrupt main-site login. Six auth/security tests and production build pass.

- Added Game Master eight-step clickable walkthrough and contextual next-action card, automatic walkthrough for new games, explicit local-vs-phone status, and clearer player waiting text. Online clue picks require Start game. Popout uses a short-lived same-browser, account-bound handoff of the current session to avoid stale cloud snapshots after save conflicts. Verified syntax, 9 guidance states, 14 engine checks, Next production build, mobile join/team/pick/buzz, desktop scoring/undo/media, walkthrough clicks, and 1980×1020/4K public layouts.

## XSTUDIO private workspace — 2026-10-16

- Agents inspected the installed XSTUDIO plugin, studio repository and deployment, and Fuschia Light House project before implementation. XSTUDIO was an installed prompt/asset workflow, not an existing web app. A separate `xstudio-app` was added on `codex/xstudio-private`; the main studio app and WAMarket were not edited.
- Reused XSTUDIO's logo, production contract, references, and validation scripts. Built an owner-only library with private upload/download, source and approval status, owner token management, and optional Gemini/xAI image adapters. Flow and Video Express AI remain manual sources pending verified APIs and credentials.
- Applied XSTUDIO-only tables, RLS, private storage bucket, token table, workflow status, and bucket limits in Fuschia; seeded only verified Auth UID `112e268b-1af9-42e7-b8cb-877b63f74344` for `xrkr80hd@gmail.com`. Deployed `xstudio-assets-api` version 3 with scoped token upload/download and owner-JWT token management. Anonymous token and asset requests return 401.
- Local Next 16.4.2 production build passed, seven focused tests passed, npm production audit found zero vulnerabilities, and anonymous/local negative auth checks passed. A short-lived, scoped integration-check token was accepted by both Edge read and write paths (read returned 404 for a nonexistent asset; invalid upload returned 415), then revoked; zero active tokens remain. Owner password login, authorized file transfer, and owner token issuance through the UI still need a live owner session to verify.
- Live SQL changes were applied through the connector but were not recorded in Supabase's migration ledger. Do not run `db push` until that ledger is repaired by an authenticated project CLI account. The 100 MiB owner upload path also needs verification against the project-wide Supabase limit.
- Created separate Vercel project `xstudio-private` under EBEN, set Next.js and root `xstudio-app`, configured production Fuschia public variables and owner UID, connected `xrkr80hd/xkr80hd.studio`, tracked only `codex/xstudio-private` for production, and added `xstudio.xrkr80hd.studio`. Deployment `9naDgEg17JwfDcQYz8PwmFVPXXaP` from commit `2a7930d` is READY. Its production alias serves login with HTTP 200, redirects anonymous `/` to login, and returns 401 for anonymous asset/token routes.
- After owner sign-in to name.com, added only the `xstudio` CNAME to `91e60a87ff492a95.vercel-dns-017.com` with TTL 300. Name.com's record list confirms the saved value; its authoritative nameserver, Cloudflare DNS, and Google DNS return the same CNAME. Vercel shows `xstudio.xrkr80hd.studio` as `Valid Configuration` for Production. HTTPS certificate and routing verified against the Vercel target with SNI (`/` redirects to `/login`, `/login` returns 200, anonymous asset and token endpoints return 401). The local resolver/browser still cached an earlier NXDOMAIN at the time of verification, so direct browser navigation awaits cache expiry. Owner login and positive asset transfer still need the owner to sign in to XSTUDIO.

### Owner password recovery

- Added a password reset request to the XSTUDIO login for the existing `xrkr80hd@gmail.com` Fuschia Auth user. It uses browser-side Supabase PKCE and redirects to `https://xstudio.xrkr80hd.studio/auth/callback`; the user must open the recovery email in the same browser.
- The callback accepts only a recovery-code exchange, verifies owner identity and membership, and sets a signed, HttpOnly 10-minute grant tied to that Auth session. Both `/update-password` and its same-origin POST require the grant; successful password update clears it and signs out. No new user or service-role key was added.
- Build and focused tests passed. Local anonymous checks: `/update-password` redirects to login, password update POST returns 401, callback without code redirects to login with an invalid-link notice.
- Handoff: add `https://xstudio.xrkr80hd.studio/auth/callback` to Fuschia Auth allowed redirect URLs, set server-only `XSTUDIO_RECOVERY_COOKIE_SECRET` to a random 32-byte base64url value in Vercel, deploy this branch, then have the owner request and use a recovery link in the same browser. The shared Auth email template was not changed.

## XSTUDIO migrated library access (2026-10-17)

- Replaced the owner library's silent 100-record cutoff with stable 100-record pages and complete client retrieval, retaining owner authorization, no-store responses, and ID deduplication.
- Verified eight existing security/provider/recovery tests and a successful Next.js 16.4.2 production build. Live deployment verification follows publication.
- Migration storage was independently verified: 502 unique files / 942,196,738 bytes copied to Fuschia, 55 deleted-only files purged, existing active project records and short codes retained. XCE connector hosting remains on the ChatGPT Site; storage migration alone is not permission to suspend that connector host.

## XCE online studio restoration — 2026-10-17

- Restored the original XCE project, workspace, reference, story, shot-list and color-grade interface from the read-only Sites snapshot (0ca93b08), adapted to the online studio's existing owner session and Supabase engine. The GPT Site source is unchanged.
- Added immediate UUID project scaffolding, seven local asset libraries, IndexedDB with localStorage fallback, queued revision-checked synchronization, conflict preservation, local backup export, and an offline application shell. Local storage availability is reported honestly; export is required before clearing device data.
- Added cached inline previews, generated thumbnail previews, shared persistent Grid/List controls, native asset dialogs, larger touch controls, a dedicated Rules route, and preserved connection creation/revocation in its own page.
- Added strict project-only @Asset binding, immutable reviewed locks, parent character/location binding, attached-image selectors, and actual reference-byte injection in the Gemini adapter. Missing, ambiguous, unlocked and cross-project references stop compilation. The text-only Grok adapter is blocked for anchored production; no paid generation was invoked in verification.
- Extended the existing Edge engine authorization to accept a verified allow-listed owner session as well as its existing scoped connector tokens. No service-role key is exposed to the browser.
- Verification: production Next build and TypeScript passed; 21 tests passed, including concurrent local creation, stale-sync edit preservation, offline creation/cache, reference injection, auth-origin validation and recovery checks. Browser checks confirmed local project creation, image attachment, reviewed lock, bound prompt, persisted List view, and asset/image persistence after a fresh reload. Local test records remain on localhost only. Live release verification follows the authorized Git push.

## Connections and key visibility (2026-10-17)

- Rotated the revoked XCE token into a new owner-scoped 30-day read/write credential, installed as a Sites server secret; deployment succeeded and live XCE returned all 11 active projects. Revoked tokens remain revoked, primary Supabase storage unchanged.
- Updated the current ConnectionsPanel with separate tool choices, custom tool support, named one-time key display, Copy key feedback/manual fallback, and active/revoked/expired history with dates. No existing token plaintext is retrievable.
- JSX compilation passed. Existing eight security/provider/recovery tests passed. Signed-in UI verification remains unavailable in the agent browser; no provider generation or credit spend was performed.

## Thumbnail and navigation repair (2026-10-17)
- Fixed preview selection choosing asset IDs before existing attached references. Four focused regression tests and eight existing tests passed.
- Added Back and Overview / Project / Current page breadcrumbs throughout the studio, plus View reference uploads beside the workspace upload action, opening and scrolling to the project's image gallery.
- Studio TSX compilation passed for the navigation changes. Live signed-in visual verification unavailable to agent browser.

## Character cast organization (2026-10-17)
- Added Main Cast, Supporting Cast, Background Cast and Unsorted Characters accordions. A dropdown on each character card persists its group, including for existing legacy/locked characters. Other asset libraries remain unchanged. Existing characters remain unsorted until assigned.
- Group metadata lives separately from immutable visual anchors. The mutation route verifies origin, owner session, folder access, character membership and current revision. Creature records are excluded.
- Three focused regression tests passed (locked record/code preservation, invalid/non-character rejection and group moves); UI TSX compilation passed. Production build verification follows publication; signed-in browser visual verification is unavailable.

## CGE profile storage and editing (2026-10-17)
- Added XCE_COLOR_GRADE adapter and validation, preserving the complete canonical object under cge_profile, including source text and extended parameters. Existing native format remains supported; no database schema/data migration or factory file change.
- Added Add grade, staged JSON upload/paste, editable parameter accordion and canonical export. Import no longer saves immediately. Save remains explicit; factory edits require duplication; current version history and assignment protections remain.
- Added authenticated owner-session GET/POST /api/color-grades and PATCH /api/color-grades/[grade_id], with folder checks, same-origin mutation checks, explicit confirm flag, required project/revision, create collision protection, version checks and readback verification. These routes are not a new external bearer-token connector.
- Six focused tests passed: canonical round-trip, existing-grade/factory/assignment preservation, history and stale versions, native compatibility, malformed input rejection and parameter prompt inclusion. UI/API TS syntax checks passed; production build follows Git publication. Signed-in browser verification unavailable in the agent session.
