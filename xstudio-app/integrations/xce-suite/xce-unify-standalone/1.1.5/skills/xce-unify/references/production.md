# Production state and schemas

## XCE CORE RULES v2.5 apply
The XCE CORE RULES v2.5 at the top of SKILL.md govern this file. Where this file disagrees with them (XSTUDIO anchor access, one frame per image, frame counts, numbering, naming, the per-frame review gate, invideo video, native audio only), the core rules win.


Use these as in-chat structured records; do not imply a server/schema endpoint exists. Keep unknowns null, arrays empty when none, and sources attached to claims. Logical IDs index actual assets only when mapped; IDs do not establish retrieval. Record independent status per deliverable, not just one project-wide success flag.

## Manifest
PROJECT_LABEL, PRODUCTION_MODE, CURRENT_STAGE, CREATIVE_CONCEPT, USER_REQUIREMENTS, CANON, PROVISIONAL_IDEAS, REJECTED_IDEAS, DIRECTOR_SIGNATURE, COLOR_GRADE, SCRIPT_VERSION, SCRIPT_BEATS, SHOT_LIST_VERSION, SHOT_MODE, CHARACTER_REGISTRY, VEHICLE_REGISTRY, LOCATION_REGISTRY, REFERENCE_ASSET_MAP, SHOT_REFERENCE_MAP, SHOT_APPROVAL_STATUS, IMAGE_GENERATION_STATUS, FIRST_FRAME_STATUS, LAST_FRAME_STATUS, VIDEO_PROMPT_STATUS, CONTINUITY_REPORT, OUTPUT_RECEIPTS, KNOWN_BLOCKERS, NEXT_OPERATION.

Add AUTHORIZED_SCOPE, GENERATION_QUEUE, EDIT_TIMELINE, CHANGE_DEPENDENCIES, PAUSED, COACHING_PREFERENCE when useful. Map former scene_intent/canon/proposals/characters/script_revision/shot_list/grade/output_receipts/next_step into these fields rather than maintaining a competing handoff object. Retain trailer_revision/trailer_runtime/trailer_beats/edit_order/spoiler_limits for trailer work. Distinguish source fact, observed image feature, user adoption, proposed default and estimate. Version changed scripts/shot lists; retain source/revision lineage.

## Status, dependency and receipts
Status enum: PLANNED, GENERATED, REVIEWED, APPROVED, BLOCKED, FAILED. PENDING is a queue flag for unexecuted work, not evidence of generation. APPROVED requires actual user approval of the relevant reviewed item; GEN ALL is authorization, not blanket visual approval. GENERATED requires a real successful result, REVIEWED actual inspection. For text stages record drafted/checked without claiming an image was generated. Track stale_after_mod separately; invalidate affected approvals while retaining output history.

Each output receipt: local_receipt_key, deliverable_kind, shot_id or registry_id, source_reference_keys, actual_tool_name, attempt_number, result_status, actual_accessible_asset_locator (nullable), newly_generated_boolean, reused_from_receipt (nullable), visually_inspected_boolean, review_findings, approval_source (nullable). Include failure reason and queue position where applicable. Do not fabricate timestamps, IDs, URLs, file paths or provider metadata. Logical receipt keys are explicitly local, not provider IDs.

Actual count = successful newly generated returned images, broken down by kind; count successful corrections separately. Reuse count is separate. Count planned assignments, failed attempts, blocked assets and pending assets separately. One sheet = one image, not its view/panel count. Deduplicate actual assets and do not double-count one image reused for multiple boundary slots. Seven cinematic slot assignments and fourteen boundary slot assignments are distinct from unique new image count.

## Registries
Character: CHARACTER_ID, name/unknown, real_or_fictional, approved_description, identity_sources, canonical_anchor_assets, wardrobe_variants, continuity_constraints, status.
Vehicle: VEHICLE_ID, verified_make_model_year_trim, unknown_features, source_photos, nine_view_coverage, canonical_assets, paint_wheels_lights_interior, modifications, status.
Location: LOCATION_ID, real_or_fictional, name, source_visuals, verified_geometry, landmarks_signage_remodel, unknown_or_conceptual_features, canonical_assets, status.
Reference map: logical_reference_key, actual_locator/attachment, original_or_generated, accessible_and_inspected, approved_or_provisional, assigned_entities, allowed_usage, source_revision. Preserve original sources separately.

## Script beat
SHOT_NUMBER, START_TIME, END_TIME, DURATION, SCENE_PURPOSE, VISIBLE_ACTION, VOICEOVER, CHARACTER_DIALOGUE, SOUND_EFFECTS, AMBIENCE (native only, never music), TRANSITION, START_STATE, END_STATE.
Timing: END_TIME minus START_TIME equals DURATION; beats cover approved runtime without unintended overlaps/gaps. Dialogue must fit an honest speakable duration. Preserve requested title/CTA, brand and audio restrictions. Never invent current offers, incentives, discounts or legal disclosures.

## Shot
SHOT_ID, SHOT_NUMBER, DURATION, START_TIME, END_TIME, DIRECTOR_SIGNATURE, AS_MODE, LOCATION_ID, CHARACTER_IDS, VEHICLE_IDS, ACTUAL_REFERENCE_MAP, START_WORLD_STATE, VISIBLE_ACTION, END_WORLD_STATE, CAMERA_START, CAMERA_MOVEMENT, CAMERA_END, LENS_INTENT, LIGHTING, COLOR_GRADE, VOICEOVER, DIALOGUE, SOUND_EFFECTS, MUSIC_BEAT, TRANSITION, CONTINUITY_CONSTRAINTS.
Record WORLD and CAMERA separately. Default SHOT-01 through SHOT-07. Explicit count overrides adjust numbering/final shot without adding an eighth 'FF'. Track intentional cuts/ellipses, axis resets and source dependencies. Per-shot boundary assignments: FIRST_FRAME and LAST_FRAME, actual receipt or BLOCKED/PENDING reason, composition/state suitability and reuse evidence.

## Independently copy-ready video prompt
SHOT_ID
SHOT_TITLE
TARGET_GENERATOR
DURATION
ASPECT_RATIO
START_FRAME_REFERENCE
END_FRAME_REFERENCE
CHARACTER_REFERENCE_IDS
VEHICLE_REFERENCE_IDS
LOCATION_REFERENCE_IDS
SCENE_DESCRIPTION
STARTING_VISUAL_STATE
SUBJECT_ACTION
CAMERA_ACTION
LENS_AND_COMPOSITION
LIGHTING
COLOR_AND_GRADE
ENVIRONMENTAL_MOVEMENT
ENDING_VISUAL_STATE
CONTINUITY_RULES
NEGATIVE_CONSTRAINTS
AUDIO_DIRECTION
VOICEOVER_OR_DIALOGUE
TRANSITION_OUT

Repeat all actual necessary identity/geography/motion details in every prompt. Use NONE where genuinely none; BLOCKED: exact missing asset when unavailable. Include timing within camera/subject action. Prompt preparation may complete while reference inputs remain blocked; label it text-complete/input-blocked, never ready-to-run with nonexistent attachments.

## Edit timeline entry
TIME, SHOT_ID, VISUAL_ACTION, CAMERA_ACTION, AMBIENCE_CUE (native only, never music), SFX_CUE, VOICEOVER, TRANSITION. Include dialogue in VOICEOVER with a clear dialogue label or a separate DIALOGUE field. Distinguish measured beats from BPM estimates and proposed silent edit markers.

## Continuity report
For every shot/output: planned/reference checks, observed image checks, character/vehicle/location fidelity, action inheritance, camera/axis/light/grade, unresolved deviations, actual correction attempts, status, confidence/inspection limitations. A checklist alone does not prove visual fidelity.
