# Recorded live release protocol

## Boot and inventory

The attached App is the existing verified XCE connector, not a new server. At boot inspect live xce_composer schema and source_url, then projects/inventory/read for the explicit scene. Resolve all scene references, including relevant character/creature MCS, face/body crops, wardrobe, props, vehicles, rooms/locations, current alternate forms, mounts and equipment. Do not load unrelated private assets. Source proof and reference-byte proof are separate. Creation-time connectivity must never be carried forward as proof in a later session.

Load plugin-registry.json. Each entry stays visible as CONNECTED_TOOL, HOST_WORKFLOW, UNAVAILABLE or NOT_REQUIRED for this job. Required writing roles can execute as loaded host workflows using their bundled rolebooks; that is not an API call to another agent. Refresh installed roles when available. Embedded CGE and Composer use their actual parent plugin and live operations. No invented standalone CGE endpoint, hidden dependency auto-install or global boot priority is supported by a skill manifest.

## Scene payload

Keep one shared payload with:

- Source/project/scene IDs, live project revision, explicit destination, package/schema versions, source prompt and scene intent.
- Actual team roster and image-reference mapping with asset state/version, source role, image hash where retrieved and current availability. Do not package credentials or temporary signed access links.
- Approved script revision, narrative intentions, unresolved questions, beat IDs, exact speaker IDs/names, mood, raw dialogue, Action 1 and Action 2.
- Actor/prop environment world-state, continuity mode SS/AS, approved camera package, scene lens and light-source geometry, current grade ID/version/intensity/look.
- Per-role invocation evidence, approval revision, stage, result and errors. A host workflow has no fabricated tool call ID. An actual API receipt is recorded only when returned.
- Per-beat four-angle group, explicit selected continuation angle, and per-shot actual media receipts, observed/reviewed differences, filenames/paths only for existing files, timings, isolated prompts and approval status.

The orchestrator JSON supplied in the request is an illustrative payload, not a formal JSON Schema. continuity.schema.json is its typed implementation contract. Do not seed sample Terra/Sabin assets or assume their clothing from the example. Frozen canonical inputs and newly proposed acting choices remain distinguishable.

## Release gates and invalidation

| Release | Required evidence | Result |
| --- | --- | --- |
| Boot → narrative | Successful current source handshake, intended project, real roster and intent or existing script | LTSTLK planning or intent analysis |
| Narrative → composition | Script/beat revision explicitly reviewed and approved; actual selected references resolved | Per-beat staging/camera and proposed shot list |
| Composition → MV | SS/AS chosen; original MCS plus scene baseline; continuity plan and camera axis | Four-angle coverage setup for each beat in UNIFY; legacy standalone seven-shot mode is separate |
| Framing → grade check | Current saved grade or staged look identified, scene lighting/lens known | One repeated look lock across shot payloads |
| Compiler → render | Current reference/camera/action-focus approvals, locked look and fresh four-angle batch Y/GEN or explicit 123GO | Actual separate 16:9 images |
| Render → complete | Actual outputs, measured dimensions, visual inspection and user output review | Completed image/prompt package |

A changed source image, anchor version, participant, wardrobe, script beat, blocking, grade or final frame invalidates that revision's affected descendants. Preserve unrelated approvals. Never keep a prior LOCKED_CONTINUOUS label after modifying the plan. Invalidation runs forward from the earliest affected AS shot; an SS camera-only edit may invalidate just that shot, provided the frozen world state/look are unchanged. Re-read live grade/version after a saved-preset change. No live push/mutation is implied by this session-only invalidation.

A role handoff records snapshots only after successful completion. start_world_state contains every present actor and tracked prop, even while another character speaks. World state includes positions, orientations/eyelines, wardrobe/state/prop contact, room geometry and world-space lighting. Camera start/end separately track focal length, anamorphic profile, view axis and position. At an AS cut, inherit the entire world state exactly; record an approved cut/transition for camera differences. SS keeps the same physical instant throughout; dialogue/action progression is not spread across seven frozen views.

Direction Box 1 acts before or during the line. Direction Box 2 bridges toward the next beat. The end state must reflect both; do not reset the first actor when the speaker changes. Infer camera-visible micro-actions as proposals, never as already observed events. A sentence describing a pose is not evidence that a renderer produced it.

## Output and proof

PLANNED images have only a planned filename. GENERATED means actual returned image bytes or a real tool image result exists. REVIEWED additionally requires visual review and explicit output approval for the exact revision. In local packaging, require actual PNG files, measured 16:9 IHDR dimensions, matching SHA-256 and declared paths; scripts/ledger.py performs those checks when --verify-media/--bundle is selected. It does not verify facial likeness, physiology, lighting quality, wardrobe, action or spoken timing. Only human/visual review can assess those.

For bundle output, use scripts/ledger.py ledger.json --bundle scene.zip after references and outputs are actually accessible and the user requested that package. It copies, never regenerates or edits frames. ZIP names use Shot_01_16x9.png etc, plus ledger.json and separate prompts/Shot_01_image.txt, Shot_01_motion.txt and Shot_01_dialogue.txt. Media availability is not assumed from a URL or filename. Only generated files enter the image ZIP; no empty/dummy PNG placeholders. If outputs are incomplete the bundle fails; deliver truthful partial results instead.

Prompt rendering format: title outside each fenced block, only raw copyable content inside. Separate each shot's image prompt, motion prompt and each dialogue line; normal status messages remain prose. User-requested prompt outputs coexist with actual images; a prompt cannot substitute for an explicitly requested frame. A 35mm/grade lock is a guidance constraint, not an engine guarantee. Do not claim one-click downloads when the actual host only supplies copy controls.

Existing XCE save APIs remain authoritative. Register real finished references and manage named shot lists only with an explicit destination/name and required approvals. Follow native expected_revision/version checks and read back uncertain writes before retrying. No current ledger save endpoint has been verified; session snapshots/exported ledger are portable state, not automatic site sync. The user can continue in chat without repeatedly pasting already available context. A future website ledger endpoint needs separate implementation, testing and explicit push authorization.


## UNIFY four-angle override

Read harmonization.md. UNIFY now uses FOUR spatial coverage angles per beat; do not interpret this as four narrative advances or the old seven-shot workflow. Each coverage angle has a real master reference ID, approved camera choice, camera state, world state at the chosen action moment, image/motion prompts and its own output receipt. Track all four independently. Parent beat end_world_state/camera_end are finalized only after explicit user selection and output review, copying the selected angle's physical/camera state exactly. If a selected keyframe does not depict the intended motion end, resolve that mismatch before proceeding. Never infer end posture from an angle number or silently choose your preferred camera.

The next AS beat cannot release until the preceding generated group has an explicitly confirmed continuation selection. Update affected downstream planned states and approvals after selection; don't pretend a previously drafted different ending remains current. In SS the frozen world instant remains unchanged across all angles. All four share grade, light-source geometry and locked identity. Camera transitions may differ with explicit approval.

For file packaging, flatten each beat's four coverage outputs in stable beat/angle order into Shot_01_16x9.png etc. Include coverage-map.json mapping every filename to actual beat ID and angle number; keep the canonical continuation pointer in ledger.json. The canonical top-level receipt is an alias to the selected actual frame, not a fifth image. Do not bundle the alias a second time.
