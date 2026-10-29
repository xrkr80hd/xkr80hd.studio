# XCE plugins: Core Rules v2.4 (2026-10-29)

| Plugin | Old | New |
| --- | --- | --- |
| XCE_DIRECTOR | 1.0.1 | 1.1.4 |
| XCE_FIRESTARTER | 1.0.5 | 1.1.4 |
| XCE_IGNITION | 1.0.5 | 1.1.4 |
| XCE_MV | 2.0.6 | 2.1.4 |
| XCE_SCRIBE (script) | 1.0.7 | 1.1.4 |
| XCE_UNIFY | 1.0.11 | 1.1.4 |

## New in v2.4: context bleed fix (core rule 2), the real cause of merged frames
ChatGPT's built-in image tool builds on the whole chat, not just the prompt. The shot list,
timecodes and taglines in the chat were being drawn into every render as one ad collage.
- Before rendering, the chat holds only a one-line plan. The shot list shows only on LIST.
- The timed script and on-screen copy are written after every frame is approved and go into
  the invideo brief as overlays, never into a frame.
- Commercial frames are clean film stills: no title cards, end cards, logos, prices or CTAs.
- One frame per image call, shown as soon as it's ready.
- After any merge the chat is contaminated, so there are no more retries there. ChatGPT gives
  a RENDER PACK: one self-contained prompt per remaining frame to run in a fresh chat, then
  the frames come back for review and video.
- New commands: LIST, RENDER PACK.

## From v2.3: wardrobe wording (core rule 2)
- Swimwear, athletic wear and costumes are written as ordinary wardrobe in plain garment terms
  (type, cut, color, fabric, fit), with a setting that fits, neutral or everyday poses and
  eye-level framing. No body-focused wording.
- No cover stories added to prompts. If the image tool refuses, ChatGPT says so, offers one
  reworded version under these rules, and stops.

## From v2.2: MCS sheets are built, not drawn in one shot (core rule 3)
MCSRLSMPL kept coming back with 8–10 panels even though the contract said 6, because image
models can't reliably count panels inside one picture. Now:
- ChatGPT renders the six views as six separate single images: S1 front body, S2 90° left side
  body, S3 three-quarter body, S4 rear body, S5 front face close-up, S6 90° left face profile.
- S1 goes first; S2–S6 use the same reference plus the approved S1 so the person and outfit
  match.
- Each view is checked on its own. A wrong one regenerates only that slot.
- Python assembles them into one 2400×1350 (16:9) strip of six 400 px columns. It always has
  exactly 6 panels.
- CMPLX builds the same six core slots, then adds only the requested detail studies.
- Every Ignition rolebook copy and the HERO casting line now point to this build method.

## From v2.1: anti-grid recipe (core rule 2)
v2.0 told ChatGPT not to merge frames, but its image tool still returned contact sheets and
retries didn't help. Image models copy the layout of their references and any counts in the
prompt, so v2.1 removes those triggers:
- **Single-panel references only.** A strip, turnaround or sheet (including the MCS strip) is
  cropped to one panel with Python before it's attached.
- **Merged or rejected results are never used as references.** Before, a failed sheet could
  become the reference for the retry, which taught the model the grid.
- **Clean prompts.** Each prompt describes only its own frame, starts "One single photograph:"
  and ends with a single-image line. No counts, frame numbers, labels, "shoot", "set",
  "series", "poses" or "angles".
- **SPLIT** (new, optional): cuts a merged result into separate PREVIEW images that go through
  the review gate.

## From v2.0

## In every plugin
- **XCE CORE RULES v2.0 now sit at the top of every SKILL.md**, word for word the same, and
  override everything below them. They replace the old "STRICT IN-CHAT EXECUTION CONTRACT".
  Every reference file now points back to them.
- **XSTUDIO is allowed again (read-only).** Anchors come from XSTUDIO through the XCE app by
  exact code, with images, LOCKED by default; then chat attachments; then images made in the
  chat. Before, every plugin forbade XSTUDIO.
- **One frame per image, enforced.** No grids, contact sheets or "all 7 on one sheet". A merged
  result is discarded and that frame is regenerated alone.
- **Storyboard no longer triggers sheet mode.** Only the command SHEET makes a board, and only
  from frames you've approved.
- **Numbering:** frames are generated clean, then labeled bottom-left (e.g. FF6-SC12 · 03/07)
  with a tool that doesn't repaint the image. The file name carries the same label.
- **Naming and folders:** XSTUDIO / <Project> / <Characters | Vehicles | Locations | Props |
  Scenes>; anchors "<CODE> — <Name> — <LOCKED|DRAFT>".
- **Review gate:** every frame comes back with a "Could be better:" note. A3 / A ALL approve,
  X3 rejects, R3 [note] regenerates, B3 applies the note. Regenerations become v2, v3; old
  versions are kept. Nothing goes to video until every frame is approved.
- **Video goes to invideo** on the VIDEO command: ChatGPT pushes the approved frames straight to
  its @invideo connector as one brief (below). XSTUDIO is never part of the video step. If
  the files can't go through the connector, you get the brief plus the exact file list to drop in.
- **One invideo brief on push** (new file references/invideo-handoff.md, identical in every plugin): built from invideo's own documented workflow. Always Ask mode, characters then locations locked by version, each approved frame used as its shot's keyframe, shots listed "in this exact order" with start state = previous end state, a native-audio block that forbids music, and a "no music track" confirmation before H.264 export. It must pass an 8-point SEND CHECK before sending.
- **Native audio only, never music.** Every video prompt ends "Native audio only. No music.";
  invideo requests say "No background music"; its mute option is never used; any clip with
  music is flagged.
- **Frame counts in one table:** 7 for films and commercials (6 or 12 only if asked), 1 for a
  quick scene or grade preview, the MCS strip for anchors.
- Paid credits still require your approval, once per batch.

## Fixes inside the plugins
- **Drift removed:** Firestarter, MV and Script were carrying older copies of the MV, Script
  and UNIFY rulebooks (up to four versions of the same file). They now carry the owner's
  current version. UNIFY keeps its own adapted copies.
- **Music removed from templates:** the script, commercial and production-record templates
  ("dialogue/VO/SFX/music", MUSIC_DIRECTION, MUSIC_CUE, "original music direction") now use
  native ambience and SFX.
- **Four-angle no longer a default anywhere.** It stays available only if you explicitly ask.
- Firestarter and Script now include DSE, since their MV rulebook links to it.
- UNIFY handoff.md links fixed (they pointed to the wrong folder in 1.0.11).
- Manifest descriptions updated; they no longer say XSTUDIO is forbidden.

Unchanged: every existing command (LTSTLK, RPTPLS, STBY, ANSR, SHFT, NXT/11, MOD, SL, SS, AS,
FF/LF, CES, RL, CB, DSE, CGE, MCS, MVS, GEN ALL, DIRECTOR LIST…), the six-slot MCS and
nine-view MVS contracts, DSE/CGE, the pipeline order and all creative rules.
