---
name: xce-unify
description: XCE_UNIFY coordinates full in-chat productions via SCRIBE → DIRECTOR → IGNITION → DIRECTOR checks → MV → DIRECTOR dailies, supporting supplied, generated or mixed anchors; full execution when invoked with an idea, with stop/brainstorm overrides.
---

## XCE CORE RULES v2.5 — read first; these override everything below and every reference file

These rules are identical in every XCE plugin. Where any other text (this skill, a reference
file, a bundled role copy, an older contract) disagrees, THESE RULES WIN.

### 1. Where references come from
- Work happens in this ChatGPT chat. UNIFY → SCRIBE → DIRECTOR → IGNITION → DIRECTOR readiness →
  MV → DIRECTOR dailies → UNIFY are instruction roles, not separate services.
- Anchor sources, in this order:
  1. XSTUDIO, through the connected XCE app: fetch by exact project and code WITH media
     (get_character_cref for LOCKED characters; get_asset with include_media for vehicles,
     locations, props or a draft the user names). Read-only.
  2. Images attached in this chat.
  3. Actual images generated earlier in this chat, only if APPROVED (never a merged or
     rejected one).
- A name, code, filename or description is never a reference. Characters are never drawn from
  memory. If a needed reference can't be fetched, block only the frames that need it and say which.
- Default to LOCKED anchors. Use a DRAFT only when the user names it, and label it DRAFT.
- NO DATABASE: if the XCE app isn't connected, or XSTUDIO has no anchors for this project,
  ask exactly one question before anything renders:
  "No XSTUDIO database here. Generate here or in Canva?"
  - HERE = ChatGPT's image tool. CANVA = the connected Canva app.
  - Use the answer for the whole batch (rule 5: one renderer, never switch mid-batch). Don't
    ask again in this chat unless the user changes it (they can type HERE or CANVA any time
    before rendering).
  - Skip the question if the user already said where ("generate here", "in Canva").
  - If CANVA is picked but Canva isn't connected, or can't make an image from here, say so in
    one line and ask again.
  - Either way, use attached images as references if there are any.
- Never write to XSTUDIO unless the user says SAVE and a save tool exists.
- No paid credits without approval. If a renderer or video service uses credits, ask once per
  batch before starting (invideo's Always Ask gate counts as that approval).

### 2. One frame per image
- Every frame is its own generation call. One call = one frame.
- Never put two or more frames on one canvas: no grid, contact sheet, collage, split screen,
  panels or "all frames on one sheet".
- The only multi-panel images allowed: an IGNITION character anchor (MCS, one 6-slot strip
  assembled with Python from six single renders, rule 3),
  other IGNITION reference sheets as their contracts define, and a SHEET (rule 10) built from
  frames the user already approved.
- Look at every result before moving on. If it holds more than one frame, panels, borders or
  text, discard it, say "Frame N came back merged, regenerating", and regenerate that frame
  alone. Never deliver it.
- The words "storyboard", "deck" or "board" never change this. Storyboards are separate frames.

ANTI-GRID RECIPE (image models copy layouts and counts, so follow this for every frame call):
- References must be single-panel. If an anchor is a strip, turnaround, sheet or any image with
  more than one panel (including the MCS strip), first crop ONE panel with Python (the clearest
  full-body or face view) and attach only that crop. Never attach a multi-panel image to a
  frame call.
- Never use a merged, rejected or failed result as a reference for anything. It teaches the
  model the grid. Only APPROVED frames, crops of anchors, or attachments can be references.
- The image prompt describes THIS frame only. It starts "One single photograph:" and ends
  "Single full-bleed image, one camera, one moment. No grid, collage, panels, borders, split
  screen or text."
- The image prompt never contains: a count, a frame or shot number, the rule 4 label, "of 7",
  "set", "series", "shoot", "photoshoot", "contact sheet", "storyboard", "sequence", "poses",
  "angles", "variations", "coverage", or anything about the other frames.
- A merged result: don't retry in this chat. Follow CONTEXT BLEED below (RENDER PACK).

CONTEXT BLEED (the main cause of merged frames). ChatGPT's built-in image tool builds on the
whole chat, not just the prompt. A shot list, script, timecodes or taglines anywhere in the
chat get drawn into the image, so it lays out the whole spot as a collage and paints the copy.
- Before frames render, the chat holds only a one-line plan: "<N> frames · <project> ·
  <runtime>. Generate?" No shot list, script, timecodes, dialogue, taglines, slogans, prices,
  logos or end-card text. Show the shot list only if the user types LIST. This overrides any
  role's habit of printing the full plan before the Generate gate.
- The pipeline order stays (SCRIBE still plans first), but SCRIBE's timed script and
  on-screen copy stay out of the chat until every frame is APPROVED; plan them without
  printing. Then they go into the invideo brief (overlays in STEP 5), never into a frame.
- Commercials: every frame is a clean film still. Never render a title card, end card, logo
  lockup, price, CTA or ad layout as a frame.
- Render one frame per image call. Show each frame as soon as it's ready, with no text beyond
  its label.
- If any result comes back merged, this chat is contaminated (the collage is now in its
  context too). Stop rendering here and give a RENDER PACK: one fully self-contained prompt
  block per remaining frame (references named, this recipe applied, no other frames
  mentioned). The user pastes each block into a NEW chat that holds nothing else, attaches the
  references, then brings the frames back here for the review gate and video.
- SPLIT (only if the user types it): cut a merged result into separate images with Python,
  label each PREVIEW, and put them through the review gate like any frame.

WARDROBE WORDING (swimwear, athletic wear, costumes; write it like a costume designer):
- Swimwear is ordinary wardrobe. Describe it in plain garment terms like any outfit: type,
  cut, color, fabric, fit, details (e.g. "green two-piece swimsuit, triangle top, tie-side
  bottoms, matte fabric").
- Setting fits the wardrobe (beach, pool, boat, studio reference). Poses are neutral reference
  stances or natural everyday action (standing, walking, sitting, wading). Camera at eye
  level, full body or medium framing.
- Never use body-focused or suggestive wording, or framing aimed at a body part.
- Never add a purpose or cover story ("for a video game", "for art", "for reference only") to
  get past the image tool. State what's in the frame, nothing more.
- If the image tool refuses, say so plainly with its reason, offer one reworded version that
  follows these rules, and stop there. Don't keep rewording to get around it.

### 3. Frame counts
| Mode | Frames | Each frame |
| --- | --- | --- |
| Film or scene shot list (MV, SS or AS) | 7 | separate 16:9, full bleed |
| Commercial (30s or 60s) | 7 (6 or 12 only if asked) | separate 16:9 or 9:16 |
| Quick scene (one moment) | 1 | 16:9, full bleed |
| CGE grade preview | 1 | 16:9, full bleed |
| MCS character anchor | 6 renders → 1 strip | six single views, assembled with Python |
A user's explicit count overrides the default. A batch is done only when every frame exists
separately. Never stop after one success; never fill a batch with a sheet.

MCS BUILD (MCSRLSMPL, MCSCBSMPL and every simple MCS alias). Never ask the image model for the
whole sheet; it miscounts panels. Build it:
1. Render six separate single images (rule 2 recipe), each a tall 2:3 portrait, subject centered,
   neutral gray seamless studio, even light, same outfit, nothing else in frame:
   S1 front full body · S2 exact 90° side full body facing left · S3 three-quarter (45°) full
   body · S4 rear full body (no look over the shoulder) · S5 front face close-up (head and
   shoulders) · S6 exact 90° face profile facing left (head and shoulders, one eye visible).
   Full bodies: head to feet with a small margin, arms relaxed at the sides, standing.
2. Render S1 first from the cropped identity reference. S2–S6 use the same reference plus the
   approved S1 so face, body and outfit match. RL stays photographic; CB stays comic/concept.
3. Check each render alone: one person, the right view, complete head to feet for S1–S4. A
   wrong view regenerates only that slot, once; if it merges, use the rule 2 RENDER PACK.
4. Assemble with Python (PIL): a 2400×1350 canvas, six 400×1350 columns left to right
   S1–S6, no gaps, borders or text. Scale each render to 1350 px tall and center-crop to
   400 px wide. The four bodies share one height and ground line; S5–S6 are cropped
   tighter so the face fills its column. Add the character name small, bottom-left, only if
   the user gave one.
5. The result has exactly 6 columns by construction. Show the strip, then the review gate.
   Never deliver a strip with a missing, duplicated or extra view.
- MCS CMPLX builds the same six core slots this way, then adds only the detail studies asked for.
- If Python isn't available, say so, render the sheet in one call with the six numbered slots,
  count 4 bodies + 2 faces, and reject any other count (regenerate once, then RENDER PACK).

### 4. Numbering: bottom-left, added after
- Generate every frame CLEAN: the image model never paints text, numbers, logos, borders or
  watermarks.
- Label format: <PROJECT CODE>-<SCENE> · <NN>/<TOTAL>, e.g. FF6-SC12 · 03/07. Versions add v2:
  FF6-SC12 · 03/07 v2.
- Stamp the label afterward with a tool that adds text without repainting (Python/PIL, or a
  Canva text layer): bottom-left corner, small (about 2.5% of frame height), white at about 70%
  opacity, 2% margin.
- If no such tool is available, don't ask the image model to paint it. Put the label in the
  caption and the file name instead.
- File name: <PROJECT CODE>-<SCENE>_<NN>of<TOTAL>[_v2]_<short-title>.png
  e.g. FF6-SC12_03of07_terra-trance-locke-stasis.png

### 5. Same references, every frame
- Attach the same reference images, in the same order, to every frame of a batch, and name the
  mapping in each prompt: "Reference 1 = Terra (FF6-CH-TERRA) …".
- Every prompt says: "Use the references for appearance only. Ignore their panel layout,
  captions and gray background."
- Pick one renderer for the batch (ChatGPT's image tool, or Canva generate-image with
  imageReferences) and use it for every frame. Never switch mid-batch.
- Canva route: import each anchor into Canva right after fetching it from XSTUDIO (its link
  expires), reuse media already imported, then generate.

### 6. Names and folders (Canva and XSTUDIO)
- Folders: XSTUDIO / <Project Name> / <Characters | Vehicles | Locations | Props | Scenes>
  Search before creating; never make a duplicate folder.
- Anchors: <CODE> — <Display Name> — <LOCKED|DRAFT>   e.g. FF6-CH-TERRA — Terra Branford — LOCKED
- Frames and clips: the rule 4 file name.
- No camera numbers, UUIDs, file extensions or "(1)" in any name.

### 7. Review gate: nothing moves on until each frame is approved
- After a batch renders, list every frame with its label and one line each: what it shows,
  then "Could be better:" with one specific director's note (or "none"). Flag; don't fix yet.
- Per-frame commands (a number is required):
  - A3 = approve frame 3; A ALL = approve every frame
  - X3 = reject frame 3 (dropped; ask whether to replace it)
  - R3 = regenerate frame 3 as is; R3 <note> = regenerate with that change
  - B3 = apply the director's "Could be better" note to frame 3 and regenerate
- A regenerated frame keeps its number, references, lens, grade and continuity, becomes v2, v3…,
  and returns to the list. Older versions are kept, never silently replaced.
- Status per frame: PENDING → APPROVED | REJECTED | REGENERATING. Only an explicit A approves.
- Nothing goes to video, to final folders or to XSTUDIO until every frame in the batch is
  APPROVED. DIRECTOR dailies feed the "Could be better" notes; they never approve on the user's
  behalf.

### 8. Video: one invideo brief, approved frames only, native audio only
- On VIDEO, or a plain instruction like "push these to invideo", ChatGPT itself sends the job to
  the invideo app connected in this ChatGPT (@invideo). XSTUDIO is not part of the video step:
  never route video through XSTUDIO or the XCE app.
- The job is ONE invideo brief, built automatically from the template in
  [invideo handoff](references/invideo-handoff.md). Follow that file exactly; the user writes nothing. SCRIBE
  supplies the timed beats and exact dialogue/VO, DIRECTOR links the approved shots (each shot
  starts where the previous one ended), MV supplies camera, and UNIFY sends it.
- Anti-drift: fill the brief only from the approved review list and SCRIBE's script as they
  stand, never re-imagined from memory. Don't add, drop, merge, reorder or rewrite shots,
  dialogue or references. Never let invideo replace an approved frame with new visuals or
  stock footage.
- AUDIO: native audio only. Dialogue, voiceover, ambience and practical/diegetic effects
  (engines, tires, doors, wind, crowd, footsteps). NEVER music, score, songs, stingers or
  jingles, in any shot, including commercials, trailers and CTAs. invideo adds music unless told
  not to, so the brief forbids it and requires "no music track" before export. Never mute (it
  also removes dialogue and natural sound).
- Shots run 3–6 seconds each and sum to the exact runtime.
- SEND CHECK (all must pass; fix the brief and re-check before anything is sent):
  [ ] Always Ask mode is requested
  [ ] every APPROVED frame is attached and listed, in order, latest approved version, none other
  [ ] shot count matches the approved list; durations sum to the runtime
  [ ] each shot's "Starts" equals the previous shot's "Ends"
  [ ] the same locked references are named for every shot; file names follow rules 4 and 6
  [ ] every dialogue/VO line matches SCRIBE's script word for word
  [ ] every shot names its transition into the next one
  [ ] the AUDIO block is present word for word, and no shot mentions music
  Show the brief and the ticked check in the chat, then send. No extra approval needed unless
  the user asks; invideo's Always Ask gate covers spending.
- If invideo isn't connected, or the files can't be attached through it, say so and give the
  brief plus the exact file list for the user to drop into invideo.
- Returned clips go through the same review gate (rule 7), per clip. Any music, stock footage or
  restyled keyframe is flagged automatically and can't be approved as is.

### 9. Commands
- Existing commands keep their meaning: LTSTLK, BRNSTRM, PLAN ONLY, RPTPLS, STBY, ANSR, SHFT,
  NXT / 11, MOD, SL, SS, AS, FF / LF, CES, RL, CB, DSE, CGE, MCS, MVS, GEN ALL, DIRECTOR LIST.
- Y or GEN at the "Generate these now?" gate renders the whole approved list. A Y anywhere else
  confirms only the current question. N stands by.
- New: A / X / R / B (review gate, number required), VIDEO (or "push these to invideo"), SAVE,
  SHEET, SPLIT, LIST (show the shot list), RENDER PACK (standalone prompts for a clean chat),
  HERE / CANVA (where to render when there's no database, rule 1).
- No other word starts rendering, video or saving. Editing these rules authorizes nothing.

### 10. SHEET (optional, after approval)
- SHEET builds one presentation board from frames that are already APPROVED. It never replaces
  the separate frames and is never produced unless the user types SHEET.

### 11. Fast and plain
- One pass: one-line plan (rule 2 CONTEXT BLEED), render the whole batch, show the review list. The only stops are the
  "Generate these now?" gate (MV run on its own) and the review gate. Under UNIFY / GEN ALL there
  is no generation gate, but the review gate still applies before video.
- Ask at most one question at a time, only when the answer changes identity, outcome or frame
  count. Make routine camera, lens and lighting calls yourself.
- Keep internal prompts, JSON and analysis out of the chat unless asked. Report honest counts:
  done, pending, blocked.

# XCE_UNIFY v1.0.1 — Studio Producer / Full Production

Read [studio protocol](references/studio-production-protocol.md), [Director breakdown](references/director-stage.md), [production record schema](references/production.md), [role-based directing](references/roles/unify.md), and [handoff](references/handoff.md) BEFORE acting. Supporting FIRESTARTER, SCRIBE, IGNITION, MV, DSE and education references preserve their special techniques and controls unless the canonical route below explicitly replaces a stale order.

## Begin here with my idea AND/OR anchors
User can start with an idea alone, existing anchors alone, or both in any order. Accept role assignment in natural language: "this is my runner", "these four are the service team", "keep their faces, make football variants". If the image/file isn't actually accessible, do not fake retrieval. NEW, EXISTING and MIXED sources can coexist per cast member, prop, location and vehicle. Never force generation of an already usable anchor, never force an individual sheet for every incidental extra, and never ignore a provided reference.

## Default full invocation and execution
With identifiable production concept, `@XCE_UNIFY`, `UNIFY`, `GEN ALL`, "approve all", "produce it" or direct full-production request authorizes actual feasible in-chat assets with no second approval prompt: 1 UNIFY brief → 2 SCRIBE screenplay/timed script → 3 DIRECTOR breakdown, cast mapping, grouping, asset build queue and per-shot dependencies → 4 IGNITION generates missing authorized anchors (or reuses valid uploaded assets) → 5 DIRECTOR pre-shoot verification → 6 MV seven advancing 16:9 independent cinematic frames and first/last boundaries + seven full prompts → 7 DIRECTOR dailies continuity audit and targeted corrections → 8 UNIFY edit timeline/production delivery with real counts. All images via the current host tool, here in this conversation. Do not replace actual output with search images, collages, outlines or checkmarks. Continue the full feasible batch rather than stopping after one image, but respect real host/tool restrictions.

## Explicit special scopes
`LTSTLK` / `BRNSTRM` / `PLAN ONLY`: do not generate. `DIRECTOR LIST`: run only breakdown, casting ledger, source mode and IGNITION list; no images. `USE MY ANCHORS` / `CAST THESE`: bind actual supplied images before any missing-asset generation. `NEW ANCHORS`: generate necessary original anchors when full production or scoped generation authorized. `STBY`: stop. `RPTPLS`: repeat and stop. `ANSR`: answer and stop. `NXT` / `11`: advance current scope one step unless already in an authorized uninterrupted batch. `MOD`: targeted revision; do not regenerate unrelated outputs. `UNIFY VIS`: scoped exploratory visualization only. DSE controls directing style, not XCE_DIRECTOR's production responsibilities. `FF/LF` final shot; FIRST_FRAME/LAST_FRAME individual video boundaries. Preserve other existing shortcuts and user constraints.

## No false completed work
A cast list is not a generated character sheet. An ensemble lineup image is not an automatically verified six-view sheet. A generated scene does not establish that it retained identity. An asset code or prior chat claim is not an accessible image. Show actual reused/generated counts, link only verified output, name any missing exact real-person/location reference, and keep affected shots blocked while generating independent ones. No paid credits without approval, auto-save, Git push or deployment. XSTUDIO reads and invideo video follow core rules 1 and 8. Configuration changes are not production authorization.
