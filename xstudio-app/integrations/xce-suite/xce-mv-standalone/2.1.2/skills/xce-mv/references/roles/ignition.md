# XCE_IGNITION v1.0.1

## XCE CORE RULES v2.2 apply
The XCE CORE RULES v2.2 at the top of SKILL.md govern this file. Where this file disagrees with them (XSTUDIO anchor access, one frame per image, frame counts, numbering, naming, the per-frame review gate, invideo video, native audio only), the core rules win.


## Standalone operation

Work directly in the current ChatGPT conversation using its available image-generation tool. This plugin contains instructions only: no connected app, MCP server, website, external database, remote asset lookup or external storage. Never invoke the old XCE tools, register_reference, composer APIs, website preflight, project selection, generation permits or Supabase for this workflow. Never ask the user to connect a Site. Do not inherit Site-dependent gates from other XCE plugins.

Use images actually attached in this conversation. If the user explicitly requests a Library reference and Library tools are available, retrieve that exact file and inspect it; filenames and textual descriptions cannot replace the image. A project or folder name is contextual labeling, not a requirement to create or connect a project. An asset code alone cannot retrieve an image through this standalone plugin: ask for the image or an accessible Library file. Do not guess appearances or silently use a similarly named asset.

An explicit image request authorizes generation immediately. Inspect the references, prepare the requested format, call the available host image tool and deliver its actual result. Do not stop at a prompt or say ready to render. If no image tool or required reference is available, report the specific missing capability. Prompt-only requests produce only the prompt. Instruction edits and quoted command examples do not authorize generation.

## Character sheets

## SMPL character sheet — fixed six-slot render contract

This section overrides generic turnaround, portrait collage, source-sheet layout and cinematic/multiview defaults ONLY for simple MCS. MCSRLSMPL/MCSCBSMPL and accepted simple aliases request ONE sheet with exactly SIX images, not six bodies plus portraits. Freeze command, subject, medium and complexity before writing the renderer prompt. A malformed or missing character-command letter in an otherwise unambiguous MCS context must not route to vehicles; clarify only genuine ambiguity.

Layout is ONE horizontal row across ONE landscape 16:9 canvas. Think of six equal vertical strips at x=0–16.67%, 16.67–33.33%, 33.33–50%, 50–66.67%, 66.67–83.33%, and 83.33–100%; every strip spans the SAME full canvas height. These are composition constraints, not claims the renderer offers coordinate controls. There is NO horizontal division and NO bottom portrait band.

The six slots, left to right, are:
1. FRONT FULL BODY: face, shoulders, hips and feet square to camera.
2. EXACT 90-DEGREE SIDE FULL BODY: head, torso, hips and feet all in strict side elevation, facing left.
3. THREE-QUARTER FULL BODY: head and torso aligned at about 45 degrees, not a duplicate front view.
4. REAR FULL BODY: back of head, torso, hips and feet square away from camera; no looking over shoulder.
5. FRONT FACE CLOSE-UP: actual enlarged head-and-shoulders portrait, face straight to camera, using its entire full-height column. No torso-to-feet image.
6. EXACT 90-DEGREE FACE PROFILE CLOSE-UP: enlarged head-and-shoulders portrait facing left, true side silhouette and one visible eye. No three-quarter face and no second full-body side view.

Four bodies TOTAL plus two face close-ups TOTAL = six slots TOTAL. Exactly one of each specified view. No fifth/sixth body, opposite-side body, duplicated front, extra heads, bottom row, stacked portraits, triptych or asymmetrical editorial collage. The portrait columns have the same height as the body columns but a deliberately LARGER FACE SCALE; “consistent scale” applies to the FOUR body views only, never shrinking the faces into full-body scale. Match full-body heights, ground line and camera height; all four bodies show complete hair, hands and feet with breathing room. Arms down naturally, hands relaxed at sides, neutral balanced stance unless the user explicitly requests a pose change. Never inherit a seated pose into a standing turnaround by default.

Use neutral gray seamless studio, evenly lit, for all six slots by default. Reference background is not instruction to reproduce a bedroom, beach, chair, bed, furniture or scenery. Preserve requested source identity, body shape, age, hair, clothing, accessories and explicitly authorized edits; do not redesign the person while changing layout. If the user explicitly requests another background, honor it while keeping the six-slot layout. A supplied character name is a small unobtrusive label, never a seventh panel or oversized metadata block. No invented character code, type, role, gender table, specs or title card.

When the input is already an incorrect sheet, use its images only as identity/clothing evidence. Explicitly reconstruct the required layout; never copy its panel count, source poses, borders, camera mistakes, scenery or face-row arrangement. Describe its observed errors in the correction prompt. Keep the original identity references when available; do not use a failed generated design to silently redefine identity.

BUILD the sheet per the MCS BUILD steps in core rule 3: render the six slots above as six separate single images (S1 first, then S2–S6 with the same reference plus approved S1), check each, regenerate only a failed slot, then assemble the 16:9 row with Python. Never ask the image model for the whole sheet in one call; it miscounts panels. A bare “six-view turnaround” is insufficient. RL stays photographic; CB stays comic/concept.

Before rendering, verify planned count, row, order, crop type, orientation and command. When the actual result is available for inspection, count its bodies and faces and check all six slots, true profile, complete extremities, background, identity and 16:9 framing. Five/six bodies plus portraits, portraits below, missing 45-degree body, angled face profile or copied scenery FAIL the SMPL contract. Never call such output correct, approved or locked. If correction is authorized, keep the same actual identity references, diagnose the specific failed slots and repair through the image tool; do not repeat unchanged prompts or loop indefinitely. If visual inspection is unavailable, say verification is unavailable instead of claiming success.

This instruction repair is not authorization to regenerate the user's examples. No website or remote tools are involved.


MCS means Make Character Sheet. Accept case-insensitive MCSRL/MCSCB with SMPL/CMPLX and existing simple spelling aliases. RL means photographic live-action, CB means comic/concept. Preserve the current explicit subject, medium and complexity across a subsequent GENERATE or regeneration; a prior vehicle task cannot change a character command into MVS. Parse project - character name as labels without a remote lookup.

MCSRLSMPL and MCSCBSMPL: exactly six equal full-height columns in one row on a 16:9 sheet, built per core rule 3 from six single renders. Order: front full body, exact 90-degree profile full body, three-quarter full body, rear full body, front face portrait, exact 90-degree profile face portrait. Four complete body views plus two head/shoulder portraits. Neutral gray studio background, consistent scale, visible hands and feet, no additional rotations or second row. Keep the supplied character name; never invent a name. If unnamed, use UNNAMED_CHARACTER_XX sequentially. Do not print project/folder labels unless requested.

Complex MCS keeps those six core views and adds only reference-supported detail studies, without silently switching to simple. If a specific complex arrangement is essential but not provided, clarify that layout. Do not import the nine-view vehicle plan. N supplied sheets requested as a batch produce N independent output sheets, preserving their order and names rather than combining subjects.

Freeze the reference face, age, complexion, anatomy, proportions, hair and clothing unless a specific edit authorizes changing them. Change only requested attributes and preserve prior approved edits. Keep original references separate from generated versions. Use the actual reference images as supported renderer inputs. Review visible output for likeness and panel count when inspection is available; never claim an unseen output passed review. A failed sheet is not a new approved identity reference.

## Vehicles

MVS means Make Vehicle Sheet. Accept MVS RL/CB SMPL/CMPLX and vehicle RVH/VH aliases. Parse make - model - trim - optional VIN, followed by edit: instructions. Never route MCS to this camera plan. Preserve one vehicle's identity, geometry, paint, wheels, lights, factory badges, cabin, seating and approved modifications across views.

Vehicle views: centered front; driver-side front three-quarter; full driver-side profile; centered rear; passenger-side rear three-quarter; full passenger-side profile; true overhead; front cabin viewed across from driver-side access; rear cabin viewed across from passenger-side access. Do not invent doors, seats or an unseen interior. Request interior references when fidelity requires them. Keep images reusable and neutral for compositing; no dealership scenery or added promotional branding. Follow the user's requested sheet versus individual-image delivery.

A VIN is not proof of every option, paint, wheel or upholstery detail. Use supplied verified factory information and actual references; never claim VIN decoding occurred without performing it through an independently available, authorized lookup. Missing evidence remains unverified. Preserve explicit custom edits without changing unrelated vehicle features.

## Cinematic continuity and commands

Keep reference identities, wardrobe, props, environments, camera direction and user-specified blocking consistent. Preserve a real uploaded location's geometry and signage when requested. Do not invent stored character relationships, synergies or production facts. Use only user-provided continuity. A requested scene or reference edit uses the actual attached images through supported image-tool reference inputs.

STBY pauses. RPTPLS repeats understanding only and waits. ANSR answers only. LTSTLK/BRNSTRM discusses without rendering. NXT advances one logical step; it does not independently approve unrelated images. Current explicit generation commands execute without repeated confirmation. Honor user-defined shot approval workflows when supplied.

## Delivery and Library

Deliver generated images here in ChatGPT. Let the host handle its normal generated-image Library saving. Never promise that this plugin automatically assigns an image to a particular Library folder or native ChatGPT Project. A specific folder save requires available file tools and a verified successful operation; report if unsupported. Never upload to a website, call external storage tools or auto-lock an output. A do-not-save instruction overrides optional saving, subject to the host's own handling. Never regenerate merely to repair a file transfer.

## Safety and accuracy

Assess the actual reference and requested depiction under applicable platform rules. Ordinary non-explicit beachwear or superhero costumes do not alone make an image explicit. Describe clothing neutrally without adding erotic framing or unsupported age assumptions. Respect actual refusals; do not hide context, repeatedly rephrase or switch providers to bypass them. Report real failures accurately. No instructions guarantee pixel fidelity or tool acceptance.
