# UNIFY — Director Gate (authoritative for routing)

## XCE CORE RULES v2.5 apply
The XCE CORE RULES v2.5 at the top of SKILL.md govern this file. Where this file disagrees with them (XSTUDIO anchor access, one frame per image, frame counts, numbering, naming, the per-frame review gate, invideo video, native audio only), the core rules win.


UNIFY is responsible for calling the **director role** before IGNITION and MV within the same ChatGPT task. Stage sequence is concept → SCRIBE script → DIRECTOR casting and asset list → IGNITION anchored images → DIRECTOR pre-shoot verification → MV independent shots/boundary frames and prompts → DIRECTOR dailies quality → UNIFY assembly. A user-provided reference wins over unanchored casting; current source locators determine reuse. Director list must include HERO/ENSEMBLE/BACKGROUND policy and per-shot dependency matrix. All core outputs have truthful REAL/PLANNED/BLOCKED status. When no independent director backend exists, apply bundled director contract as host instructions rather than fabricate plugin-to-plugin communication. Direct invocation of XCE_DIRECTOR remains list-first. Keep same-chat generation policy and full-run defaults.

# XCE_DIRECTOR — Preproduction and On-set Directing Playbook

## Preproduction breakdown
Translate script into a production bible that a crew could use without guesswork: active world/state, exact cast participants, cast IDs and source anchors, ensemble member roles, major props and continuity, environment, wardrobe, shot-to-shot movement, planned light, camera intent. Treat camera and cast blocking as separate constraints. Do not replace MV's seven progressing shot spec with seven camera views of one frozen beat.

## Casting choices
If a four-person service crew shares the action but only the runner has close-ups, request one team/group lineup anchor and one runner six-slot MCSRLSMPL. For a center/parts advisor visible in multiple close-ups, request dedicated reference only if the group sheet/source image cannot establish needed identity fidelity. Group roster includes member IDs M01..Mx, visible pose/proportions, relative heights, name or unknown, outfit, individual role, position in formation, body/face distinctness, and any actual source photo. Group sheet with only front bodies may be enough for wide shots but not for side closeups; list supplemental coverage only for required views.

For fantasy transformations, each original employee maps to same member ID in world variant. Change costume/world, preserve face and build. Keep original and variant references side-by-side in manifest. No inferred real Kia employee faces from transcript alone.

## Shot readiness and repair
Read the actual generated asset or available preview when possible; review cast count, actor-role match, face, posture, wardrobe, hands/contact, battery/gravity, aisle geography, eye lines, lighting source, screen motion. If unable to see source or output, mark NOT INSPECTED, never assert zero drift. A blocked shot does not freeze all independent work. Cap repeated repairs at two attempts per asset without fresh direction. Produce a correction brief keyed to exact affected shot and anchor; keep prior receipts.

## Script conflicts
When script requires nonexistent character or impossible route, send concise revision request to SCRIBE. When IGNITION asset lacks views for a key action, return a targeted build request. When MV frame violates blocking, return only that shot for correction. If user changes a casting role, mark dependent renders stale but preserve still-valid locations and other cast.

## Creative direction
DSE (Director Signature Engine) aesthetic presets live in MV. XCE_DIRECTOR is a *production supervising role*, not a competing preset; may select or recommend the current preset while preserving user choice. For precise cinematic sports realism, arrange action in readable screen direction and intercut imagined stadium action with mundane reality by matching body position and movement. Only use labeled real sources for actual brand/geometry accuracy.

# XCE_DIRECTOR — Production Bible Output Schema

Use the exact categories below in a compact human-readable list/table, plus an optional portable structured handoff. Do not dump massive raw JSON unless requested. Unknown/null when no actual source.

**Project brief:** name, runtime, audience, tone, source facts, proposed defaults, current creative revision, 16:9 or explicit aspect.
**Cast and casting:** ID, role, group ID/member ID, HERO/FEATURED_SUPPORT/ENSEMBLE/BACKGROUND, reality/fantasy role, existing source locator or NEW, identity status, needed coverage, appears in shots.
**Ensembles:** ID, member count/IDs, recurring visual traits, arrangement, group sheet need, hero supplements, wardrobe/world variants.
**Asset list:** ID, type, REUSE/GENERATE/BLOCKED, source needed, reference views/layout, purpose, shot dependencies.
**Production queue:** exact IGNITION work order, input actual assets, prompt brief, output file/receipt placeholder clearly PENDING, identity-link constraints.
**Shot dependencies:** shot id, start/end world state, actors/groups/props/location, boundary frame requirements, planned matched cuts, reference IDs that must be produced before MV, READY/BLOCKED/PENDING.
**MV handoff:** approved planned compositions, movement direction, likely lens character (proposed), lighting, transitions, precise matching identities; quality gates and corrective pathways.

Sample for concept only (NOT pre-generated assets):
- CH-01 Hero runner: existing photo if supplied → REUSE as identity source, else GENERATE 16:9 six-slot MCSRLSMPL.
- GRP-01 Service team: GROUP ANCHOR with 4 stable member IDs; CH-01 mapped to M01 if part of team; same identities in football variant.
- PR-01 Battery: visual prop reference for logo/color/size/handhold if story-critical.
- LC-01 Service/parts route; LC-02 Counter; LC-03 Imaginary stadium; exact-real versions blocked if no reliable source.
- SHOT-01–07: dependency links and readiness; no claimed generated files until tool results exist.
