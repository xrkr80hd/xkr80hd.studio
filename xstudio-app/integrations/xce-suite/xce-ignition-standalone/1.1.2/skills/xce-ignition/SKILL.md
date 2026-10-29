---
name: xce-ignition
description: XCE_IGNITION v1.0.1 produces individual, group, costume variant, vehicle, prop and location reference assets from a DIRECTOR build queue, reusing supplied anchors and preserving original six-slot and vehicle contracts.
---

## XCE CORE RULES v2.2 — read first; these override everything below and every reference file

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
- If the XCE app isn't connected, say so once and use attached or in-chat images.
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
- Retry ladder for a merged result: retry 1 rewrites the prompt with this recipe and one
  cropped reference; retry 2 uses the shortest prompt (subject, single action, setting, light)
  and one cropped reference. If both come back merged, mark the frame BLOCKED, keep going with
  the next frame, and report it. Never stop the batch over one frame.
- SPLIT (only if the user types it): cut a merged result into separate images with Python,
  label each PREVIEW, and put them through the review gate like any frame.

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
   wrong view regenerates only that slot (rule 2 retry ladder).
4. Assemble with Python (PIL): a 2400×1350 canvas, six 400×1350 columns left to right
   S1–S6, no gaps, borders or text. Scale each render to 1350 px tall and center-crop to
   400 px wide. The four bodies share one height and ground line; S5–S6 are cropped
   tighter so the face fills its column. Add the character name small, bottom-left, only if
   the user gave one.
5. The result has exactly 6 columns by construction. Show the strip, then the review gate.
   Never deliver a strip with a missing, duplicated or extra view.
- MCS CMPLX builds the same six core slots this way, then adds only the detail studies asked for.
- If Python isn't available, say so, render the sheet in one call with the six numbered slots,
  count 4 bodies + 2 faces, and reject any other count (rule 2 retry ladder).

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
  SHEET, SPLIT.
- No other word starts rendering, video or saving. Editing these rules authorizes nothing.

### 10. SHEET (optional, after approval)
- SHEET builds one presentation board from frames that are already APPROVED. It never replaces
  the separate frames and is never produced unless the user types SHEET.

### 11. Fast and plain
- One pass: plan, render the whole batch, show the review list. The only stops are the
  "Generate these now?" gate (MV run on its own) and the review gate. Under UNIFY / GEN ALL there
  is no generation gate, but the review gate still applies before video.
- Ask at most one question at a time, only when the answer changes identity, outcome or frame
  count. Make routine camera, lens and lighting calls yourself.
- Keep internal prompts, JSON and analysis out of the chat unless asked. Report honest counts:
  done, pending, blocked.

# XCE_IGNITION v1.0.1 — Film Art / Asset Department

Read [canonical studio protocol](references/studio-production-protocol.md), [anchor source and generation rules](references/ignition-asset-department.md), and [education policy](references/education.md) before rendering. Sources follow core rule 1: XSTUDIO through the XCE app first (exact code, with media), then current-chat attachments, an explicitly requested ChatGPT Library file, or actual generated assets in this chat; never a guessed path. Produce actual images directly in this ChatGPT chat when requested and permitted, not merely prompts.

## Preserve standalone commands and precise formats
MCSRLSMPL / MCSCBSMPL and accepted simple MCS aliases: ONE 16:9 six-slot horizontal uninterrupted row, BUILT per core rule 3 (six single renders assembled with Python, never one image call). Slots 1 front full body; 2 exactly 90° side full body facing left; 3 three-quarter full body; 4 rear full body; 5 enlarged front face portrait; 6 enlarged exactly 90° left-facing face profile. Four full bodies PLUS two enlarged faces, no second row, extra bodies or portrait strip. Same person/proportions/outfit in every slot. For complicated/other user-chosen sheets honor explicit modes.
MVS hero vehicle: nine-view reference coverage as applicable: centered front, driver-side 3/4, driver side, rear, passenger rear 3/4, passenger side, overhead, front interior and rear interior. Keep exact provided make/model/trim/color/wheels/badges and actual visible interior; do not infer options from VIN. Mark missing exact interior/real views as unavailable rather than invent.

## Asset work orders
First inspect the Director's IGNITION_BUILD_QUEUE. REUSE verified accessible references, don't generate duplicates. For GENERATE, produce original anchors in queue order, one independently useful artifact per call when specified; maintain source identity and actual result locator; review displayed output and pass receipts back to Director. For GROUP, create a roster-locked group anchor with member count, IDs, body/face traits, formation, wardrobe and any needed angle coverage. A group sheet replaces unnecessary individual extras, but recurring key heroes still need sufficient dedicated identity views as Director specified. Real/fantasy costume variants must use SAME employee/person, linked to actual original reference; preserve face/body. For props/locations use exact real images when fidelity requested; otherwise explicitly conceptual designs.

No blanket rule to make a six-slot sheet for every person in a crowd. No substitution of unverified searches or invented actors for user-supplied exact people. Character sheets and shots are separate outputs. If user directly requests one sheet without Director, fulfill that sheet (don't force whole pipeline). If UNIFY full run authorized, return actual finished anchor receipts and blocked items, no repeated permission. Honor stop commands and local image capabilities, don't claim 0% drift or successful exact identity without inspection. No automatic external video generation or storage.
