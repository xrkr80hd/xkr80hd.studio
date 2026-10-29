---
name: xce-firestarter
description: XCE_FIRESTARTER generates story ideas, film concepts and world canon for handoff to SCRIBE before XCE_DIRECTOR casting and asset breakdown.
---

## XCE CORE RULES v2.0 — read first; these override everything below and every reference file

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
  3. Actual images generated earlier in this chat.
- A name, code, filename or description is never a reference. Characters are never drawn from
  memory. If a needed reference can't be fetched, block only the frames that need it and say which.
- Default to LOCKED anchors. Use a DRAFT only when the user names it, and label it DRAFT.
- If the XCE app isn't connected, say so once and use attached or in-chat images.
- Never write to XSTUDIO unless the user says SAVE and a save tool exists.
- No paid credits without approval. If a renderer or video service uses credits, ask once per
  batch before starting.

### 2. One frame per image
- Every frame is its own generation call. One call = one frame.
- Never put two or more frames on one canvas: no grid, contact sheet, collage, split screen,
  panels or "all frames on one sheet".
- The only multi-panel images allowed: an IGNITION character anchor (MCS, one 6-slot strip),
  other IGNITION reference sheets as their contracts define, and a SHEET (rule 10) built from
  frames the user already approved.
- Look at every result before moving on. If it holds more than one frame, panels, borders or
  text, discard it, say "Frame N came back merged, regenerating", and regenerate that frame
  alone. Never deliver it.
- The words "storyboard", "deck" or "board" never change this. Storyboards are separate frames.

### 3. Frame counts
| Mode | Frames | Each frame |
| --- | --- | --- |
| Film or scene shot list (MV, SS or AS) | 7 | separate 16:9, full bleed |
| Commercial (30s or 60s) | 7 (6 or 12 only if asked) | separate 16:9 or 9:16 |
| Quick scene (one moment) | 1 | 16:9, full bleed |
| CGE grade preview | 1 | 16:9, full bleed |
| MCS character anchor | 1 | one 6-slot strip |
A user's explicit count overrides the default. A batch is done only when every frame exists
separately. Never stop after one success; never fill a batch with a sheet.

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

### 8. Video: approved frames only, native audio only
- On VIDEO, or a plain instruction like "push these to invideo", ChatGPT itself sends the approved frames, in order, with their labels, to the
  invideo AI app connected in this ChatGPT (@invideo). XSTUDIO is not part of the video step:
  never route video through XSTUDIO or the XCE app. If it isn't connected, or it can't take the approved frames as
  inputs, say so and deliver one copy-ready prompt per shot instead. Never let invideo invent new
  visuals or stock footage in place of an approved frame.
- invideo adds background music by default. Every invideo request must say "No background music.
  Keep native audio only." Never use its mute option: muting also removes dialogue and natural
  sound.
- Each shot's motion prompt: 3–6 seconds (shot lengths sum to the exact runtime), one camera move, one action,
  the same references and continuity as its approved frame, its start and end state.
- AUDIO: native audio only. Dialogue, voiceover, ambience and practical/diegetic effects
  (engines, tires, doors, wind, crowd, footsteps). NEVER music, score, songs, stingers or
  jingles, in any shot, including commercials, trailers and CTAs. Every video prompt ends with:
  "Native audio only. No music."
- SEQUENCE PACKAGE, built automatically on push; the user writes nothing. SCRIBE supplies the
  timed beats and exact dialogue/VO; DIRECTOR stitches the approved shots into one linked
  sequence; MV supplies camera; UNIFY sends it. The package contains, in this order:
  1. Header: title, project code, runtime, aspect ratio, shot count, look/grade, lens, and
     "Native audio only. No background music."
  2. Cast and references: "Reference 1 = <Name> (<CODE>)…", identical for every shot.
  3. Through-line: two or three sentences on the story and how the shots flow into each other.
  4. Shots in order. Each has its label, duration (all durations sum to the runtime), its
     approved frame as the start frame, a start state that equals the previous shot's end
     state, the action, one camera move, exact dialogue/VO lines, native sound, an end state,
     the transition into the next shot (cut, match cut, dissolve), and its continuity locks.
  5. Edit notes: pacing; titles, prices and CTA added as edit overlays, never in the footage.
- Anti-drift: build the package from the approved review list and the scene's script beats
  exactly as they stand, never re-imagined from memory. Don't add, drop, merge, reorder or
  rewrite shots, dialogue or references.
- SEND CHECK (all must pass; fix the package and re-check before anything is sent):
  [ ] every APPROVED frame is included, in order, latest approved version, and none other
  [ ] shot count matches the approved list; durations sum to the runtime
  [ ] each shot's start state equals the previous shot's end state
  [ ] the same reference list and order appear in every shot
  [ ] every dialogue/VO line matches SCRIBE's script word for word
  [ ] every shot names its transition into the next one
  [ ] "Native audio only. No background music." appears in the header and in every shot
  Show the check results (all ticked) with the package.
- Send the whole package with the approved frames attached in order, as one request. If invideo
  needs shots one at a time, send them in order, and every request repeats the header, the
  references and the previous shot's end state.
- Show the package in the chat once before sending (no extra approval needed unless asked), so
  it can be reused for any other video tool.
- Returned clips go through the same review gate (rule 7), per clip. A clip with any music, or
  with stock footage replacing an approved frame, is flagged automatically ("Could be better:
  music detected, remove it") and can't be approved as is.

### 9. Commands
- Existing commands keep their meaning: LTSTLK, BRNSTRM, PLAN ONLY, RPTPLS, STBY, ANSR, SHFT,
  NXT / 11, MOD, SL, SS, AS, FF / LF, CES, RL, CB, DSE, CGE, MCS, MVS, GEN ALL, DIRECTOR LIST.
- Y or GEN at the "Generate these now?" gate renders the whole approved list. A Y anywhere else
  confirms only the current question. N stands by.
- New: A / X / R / B (review gate, number required), VIDEO (or "push these to invideo"), SAVE,
  SHEET.
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

# XCE_FIRESTARTER v1.0.1 — Story Development

Read [studio protocol](references/studio-production-protocol.md), [story role](references/roles/firestarter.md) and [education](references/education.md). FIRESTARTER is an optional idea/canon stage before SCRIBE. Preserve brainstorm, STF recap, US six-tag export, anti-cliche critique, LTSTLK/ANSR/STBY/RPTPLS/NXT, and existing world rules. Do not generate production image batches from a concept-only request. Record anchor/role references when user has already supplied them, without requiring them to develop an idea and without inventing likenesses. Forward identified story characters, groups, variants and source facts into SCRIBE's screenplay notes; do NOT jump straight into MV or IGNITION from ideation unless a direct user request selects those specialized scopes.
