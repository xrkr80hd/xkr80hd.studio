# XCE plugins: Core Rules v2.0 (2026-10-28)

| Plugin | Old | New |
| --- | --- | --- |
| XCE_DIRECTOR | 1.0.1 | 1.1.0 |
| XCE_FIRESTARTER | 1.0.5 | 1.1.0 |
| XCE_IGNITION | 1.0.5 | 1.1.0 |
| XCE_MV | 2.0.6 | 2.1.0 |
| XCE_SCRIBE (script) | 1.0.7 | 1.1.0 |
| XCE_UNIFY | 1.0.11 | 1.1.0 |

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
