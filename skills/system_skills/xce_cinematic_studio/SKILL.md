---
name: xce-cinematic-studio
description: Orchestrates the XCE commercial cinematic studio workflow connecting XCE_UNIFY, XCE_FIRESTARTER, XCE_SCRIPT, XCE_ENGINE, XCE_COMPOSER, XCE_MV, XCE_CGE, and Commercial Storyboard Engine with dynamic base URL routing, 4-angle UNIFY coverage, and 7-shot MV director gates.
---

# XCE Cinematic Studio — Gemini Skills Connector

This skill connects Gemini to `xstudio.xrkr80hd.studio` (or the dynamically resolved API URL) for commercial cinematic video production and asset continuity.

## Core Modules & Roles

1. **XCE_UNIFY**: Production coordinator, live scene ledger, conflict audits, approval gates.
   - **Four-angle coverage override**: 4 separate 16:9 images showing different views of ONE narrative beat.
   - **Canonical Continuation Selection**: Prompt user to pick which angle (1–4) becomes the canonical end state for the next advancing beat. Never pick automatically.
2. **XCE_FIRESTARTER**: Upstream writers' room and anti-cliche coaching.
   - `SS`: Start Story.
   - `STF`: Story Thus Far (premise, world rules, canon, proposals, open questions).
   - `US`: Update the Story (6 exact blocks: `[WORLD_TYPE]`, `[AESTHETIC_TONE]`, `[WORLD_BACKGROUND]`, `[STORY_SO_FAR]`, `[PRODUCTION_BRIEF]`, `[WORLD_RULES_CONTINUITY]`).
   - `XCE CONTINUE`: Hands off confirmed story to XCE_UNIFY.
3. **XCE_SCRIPT**: Narrative intent and script beat editor.
   - Beats: speaker, mood, Action 1, Action 2, start/end states, 3–6s duration. Only present characters speak.
4. **XCE Engine / XCE_IGNITION**:
   - Character reference assets (`--cref`) with original image bytes.
   - Character turnaround sheets: 16:9 horizontal, 6 columns: front body, side body, 3/4 body, rear body, front face close-up, profile face close-up.
5. **XCE_COMPOSER**: Staging, cast, exact references, equipment, alternate forms, spatial layout.
6. **XCE_MV**: 7-shot director workflow:
   - `SL` begins shot list, prompts `SS` (same frozen instant) or `AS` (advancing narrative).
   - 7 shots: 1: establishing wide, 2: alt wide, 3: vertical axis, 4: CU B, 5: reverse CU B, 6: wide profile, 7: detail insert.
   - `FF` or `LF` confirms shot 7 (the final frame).
   - Decision gate: **Generate these now? Y / GEN / N / MOD**.
7. **XCE_CGE**: Color Grading Engine. 16:9 preview, "Supply a pic or name a style", `PUSH GRADE`, `SAVE TO XSTUDIO`. Factory grades immutable.
8. **Commercial Storyboard Engine**:
   - `BRNSTRM`, `CMPN [Campaign Name]`, 30/60-second timed storyboard (30s = 5-6 beats, 60s = 10-12 beats). SFX-only sound design without dialogue/music.

## Shared Shorthand Commands

- `RPTPLS`: Repeat understanding and hold.
- `STBY`: Pause and hold context.
- `ANSR`: Answer only, no execution.
- `LTSTLK`: Brainstorm/plan only.
- `SHFT`: Temporary topic shift with saved checkpoint.
- `NXT` / `11`: Advance one agreed step.
- `123GO`: Execute currently approved scope only.
- `SS`: Start Story (Firestarter) / Same Shot (MV).
- `AS`: Advancing Shot in MV.
- `SL`: Begin shot list in MV.
- `FF` / `LF`: Final/Last Frame (shot 7).
- `Y` / `GEN`: Render approved list at generation gate.
- `N`: Hold shot list.
- `MOD`: Revise specified shot(s).
- `STF`: Story Thus Far.
- `US`: Update Story 6-block output.
- `XCE CONTINUE`: Production handoff to UNIFY.
- `BRNSTRM` / `CMPN`: Commercial concept / campaign lock.
- `CGE`: Start color grade workflow.

## Strict Release & Push Boundary

- Never commit, push, deploy, or migrate Git, Vercel, or Supabase without Trav's explicit "push" instruction.
- At code-release checkpoints, ask: **Is there anything else that needs to be done?**
