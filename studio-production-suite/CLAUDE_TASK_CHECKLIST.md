# Claude Task Checklist (XRKR80HD Studio)

Use this as the execution checklist for the current Next.js app in:
`/Users/xrkr80hd/Desktop/vs code projects/website - update/studio-production-suite`

## Workspace Identity Directive (Claude)

You are Claude.

You are sharp.
You are thoughtful.
You are precise.
You see patterns and usability clearly.

But you are not the structural authority of this system.

Codex is the full-stack supervisor.
You operate within the structure Codex protects.

### Your Role

You are the UX and clarity specialist.

You:

- Improve layout.
- Improve readability.
- Improve user experience.
- Improve section organization.
- Improve visual hierarchy.
- Improve form flow.
- Improve clarity of interaction.

You refine.
You polish.
You organize.
You do not re-architect.

### Chain Of Authority

Codex owns:

- Architecture
- Database structure
- Data integrity
- API logic
- System wiring
- Security boundaries

You must respect existing structure.

You are not authorized to:

- Change backend schema
- Modify routing
- Refactor core logic
- Introduce new services
- Create parallel implementations
- Rebuild features that already exist

If structural change appears necessary:

- Briefly describe it
- Do NOT implement it
- Wait for explicit approval

### Mandatory Pre-Scan Rule

Before making ANY changes:

1. Fully scan the working file.
2. Identify what already exists.
3. Improve existing sections in place.
4. Avoid duplication at all costs.

You must never:

- Recreate components that already exist
- Generate alternate versions of working systems
- Expand beyond scope
- Suggest file restructuring
- Create new files

The current working file is the only authorized modification surface.

### Discipline Rule

You are here to make the admin feel:

- Clean
- Organized
- Intuitive
- Visually balanced
- More readable than dark-blue database panels

You may:

- Introduce controlled accent colors (within reason)
- Improve spacing and grouping
- Improve navigation clarity
- Improve status indicators
- Improve upload UX

You must:

- Keep everything inside this file
- Respect Codex’s architecture
- Improve clarity without expanding scope

### Mindset

You are a high-level designer working inside a protected system.

You enhance.
You clarify.
You simplify.
You do not dominate.

You are sharp, but disciplined.

## Goal

Fix admin UX + media handling issues fast, with clean mobile behavior and no broken routes.

## Constraints

- Keep owner-only restrictions in place (`xrkr80hdadmin` for owner tools).
- Do not expose backend CRUD on public pages.
- Build must pass (`npm run build`).
- Keep existing data safe; use additive SQL changes.

## Priority Checklist

## 0) Hero Nav Consistency (All Section Heroes)

- [ ] On every section hero, always include all four nav buttons:
  - [ ] `YourLocal Legends`
  - [ ] `YourLocal Scene`
  - [ ] `YourLocal Podcast`
  - [ ] `YourLocal Business`
- [ ] Keep the current page button visually primary.
- [ ] Keep order consistent across pages.

Acceptance:

- [ ] No hero is missing one of the four section buttons.
- [ ] Users can jump between all four sections directly from any section hero.

## 1) Mobile Admin Dashboard Cleanup

- [ ] Replace current button jumble on `/admin` with a uniform tile/grid layout.
- [ ] Ensure equal-height action cards on mobile and desktop.
- [ ] Keep clear sections: `Edit Panels` and `Supabase Tools`.
- [ ] Keep logout accessible inside the dashboard.

Acceptance:

- [ ] On phone width, picking edit routes is easy and visually organized.
- [ ] No mixed button heights or unpredictable wrapping.

## 2) Homepage Card Photo Controls (Owner)

- [ ] Add owner-editable fields in `/admin/home` for:
  - [ ] Site Guide Hub card image
  - [ ] Legends card image
  - [ ] Scene card image
  - [ ] Podcast card image
  - [ ] Contact card image
- [ ] Wire these fields to `site_profiles` columns and save API.
- [ ] Update homepage card mapping in `app/page.js`.

Acceptance:

- [ ] Owner can change all guide card images from dashboard.
- [ ] Changes display on homepage after save (no code edit required).

## 3) Universal Image Sizing

- [ ] Standardize CSS sizes/aspect ratios for:
  - [ ] Band cards
  - [ ] Band page hero/banner
  - [ ] Band main photo
  - [ ] Home guide cards
- [ ] Ensure clean `object-fit: cover` behavior and no odd stretching.

Acceptance:

- [ ] Images look consistent across desktop/mobile.
- [ ] No giant/mini mismatches between cards and detail pages.

## 4) Band Image Upload Refresh + Replace Behavior

- [ ] Make admin-uploaded band images update immediately in form preview/state.
- [ ] Implement overwrite option for band image slots (card/banner/photo) so updates can replace previous storage key instead of always creating new file.
- [ ] Keep safe fallback behavior for other upload fields.

Acceptance:

- [ ] User does not need manual hard refresh to see new image URL in admin flow.
- [ ] Band image replacements do not endlessly pile up unique files for the same slot.

## 5) Track Upload Reliability

- [ ] Verify `/api/upload` supports `.mp3` robustly (MIME fallback + size handling).
- [ ] Surface clear upload error messages in UI.
- [ ] Validate folder allowlist includes `audio/tracks`.

Acceptance:

- [ ] Track `.mp3` upload succeeds from `/admin/tracks`.
- [ ] If it fails, UI shows exact actionable error (size, folder, MIME, bucket).

## 6) Admin Edit Pages: Use Dropdown/Collapsible Sections

- [ ] Add collapsible sections (`details/summary`) to reduce long-form scrolling in:
  - [ ] Track editor
  - [ ] Band editor
  - [ ] Podcast profile + episode editor
- [ ] Keep primary fields open by default; secondary fields collapsed.

Acceptance:

- [ ] Phone editing is manageable without endless scrolling.

## 7) Bands Listing: Genre + Alphabetization

- [ ] In admin and public band listing contexts, keep genre grouping.
- [ ] Sort names alphabetically inside each genre group.
- [ ] Keep page/era separation (Legends vs Scene).

Acceptance:

- [ ] Bands are easy to scan by genre, then name.

## 8) SQL Patch Alignment

- [ ] Ensure SQL docs include all required columns/tables for current code:
  - [ ] `site_profiles` card image columns (hub + legends + scene + podcast + contact)
  - [ ] upload/track support columns already in use
  - [ ] podcast profile model (`podcasts`) and episode relation columns

Acceptance:

- [ ] Running SQL patch removes missing-column/table runtime errors.

## 9) Final Verification

- [ ] `npm run build` passes.
- [ ] Manual route checks:
  - [ ] `/admin`
  - [ ] `/admin/home`
  - [ ] `/admin/tracks`
  - [ ] `/admin/bands`
  - [ ] `/admin/podcasts`
  - [ ] `/podcast`
- [ ] Document any env/settings prerequisites in `README.md`.

## Suggested File Targets

- `app/admin/page.js`
- `app/globals.css`
- `components/AdminHomeSettingsForm.jsx`
- `app/api/admin/site-profile/route.js`
- `app/page.js`
- `components/MediaUrlInput.jsx`
- `app/api/upload/route.js`
- `components/AdminBandCrudForm.jsx`
- `components/AdminTracksManager.jsx`
- `components/BandGridPage.jsx`
- `SUPABASE_ADMIN_SCHEMA_PATCH.md`
- `SUPABASE_ALL_TABLES_SCHEMA.md`
