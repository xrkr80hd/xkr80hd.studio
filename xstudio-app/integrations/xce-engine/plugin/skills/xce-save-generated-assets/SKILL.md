---
name: xce-save-generated-assets
description: Use XCE_COMPOSER for site-synchronized scene prompts and user-authored relationship or synergy clauses. Resolve private XCE asset codes and saved project references before web search. Apply to bare codes, Copy for ChatGPT, saved asset lookup, scenes and storyboards. Execute XCE image requests through the available ChatGPT image tool immediately, then save completed images when supported. Apply to MCS/CRS/PRS/RVH/LOC, SMPL/CMPLX, generate, regenerate, RGEN and authorized XCE_MV image requests. Never stop after describing or preparing the requested image.
---

## CREF — saved locked characters

For CREF or saved-character reference retrieval, read [the shared CREF contract](references/cref.md) and use the existing authenticated XCE app. Verify the live XSTUDIO schema, resolve the exact project/record, then retrieve actual locked image blocks through the discovered get_character_cref tool or xce_composer execution with category=cref. No scene configuration is required. CREF alone never starts generation or changes creative approval gates.


# XCE — saved asset lookup, production and storage

## Primary studio destination

The owner's current studio is https://xstudio.xrkr80hd.studio/ and its primary database is Fuschia Light House (Supabase). Existing XCE production tools use that backend. Keep original asset codes, assignments, names and approval states. Never fall back to writing the legacy project database, recover intentionally deleted files, or guess an image when retrieval fails.

Use xstudio_list_assets and xstudio_get_asset for files uploaded directly to the new site when those tools are exposed. Raw library files are not automatically approved character or scene anchors. For registered production references, keep using the existing project-aware tools and their validation. Link successful storage to the new studio. The legacy ChatGPT Site still hosts the XCE MCP connector; do not claim that suspending or deleting it is safe until the connector hosting has also moved.

## First decide the requested action

Apply stop controls before any tools or generation. A request to rewrite these notes is an instruction-editing task, never a rendering command. A bare code or Copy for ChatGPT package requests retrieval only unless the user also authorizes a production action.

## Explicit private-asset lookup — mandatory

Read [the lookup JSON contract](references/asset-lookup.json) for saved-asset lookup, continuation, editing, regeneration or handoff. It governs retrieval routing and failure handling; preserve existing production, access and safety requirements.

1. Use the connected **XCE — Xstudio Cinematic Engine** app for private project data. Never search the public web for an XCE code or treat familiar character names as their saved appearance. The website and this app share stored projects and images.
2. For EACH exact code call `resolve_asset_code` with `asset_code` unchanged. If that tool is unavailable, use `resolve_asset_reference` with the code in `asset_name`, or `get_reference` with the code in `reference_id`. Fallback is for unavailable tools only: an access, not-found, mismatch, ambiguity or image error must stop that lookup. Never retry a different project/name to evade it.
3. Resolve a supplied project name through XCE and verify it matches the returned owning project. With a code alone, omit project scope and let exact lookup find the owner; never substitute the saved active asset. For name-only requests inspect the intended project and disambiguate actual records, then call get_reference for each assigned reference ID to retrieve its actual image blocks. Do not create a project just to retrieve an asset or ask the user for internal IDs.
4. Check returned code, name, category, project and assigned reference IDs. Inspect actual returned images before visual work. Preserve each image's role. Keep a storyboard image intact as scene composition; do not invent shots or take character identity from it. DRAFT retrieval does not approve it.
5. For a multi-asset job resolve every required code separately. Continue production only after every required source is retrieved and checked; never silently omit a missing prop or character. Keep unrelated projects separate unless explicitly requested together.
6. If tools are unavailable, ask the user to select or @mention XCE in that message; the authorized backup recovery below may provide records while the live connection is unavailable. If a folder is locked, ask them to unlock it in Xstudio; never collect a PIN in chat. Stop on missing bytes, unsupported image format or inability to pass returned images into the renderer. Do not replace private images with web results, textual guesses or failed generations.
7. A lookup-only request ends after reporting the resolved asset. An explicit production command continues through its existing checks and the host image tool with the ACTUAL retrieved images. Re-fetch originals for retries. Generation and saving are separate outcomes; never imply either happened because lookup succeeded.

The JSON contract and these notes cannot force ChatGPT to enable or invoke an unavailable app in an arbitrary chat. Report that limit honestly. Public research remains allowed when independently requested; it is never a substitute for private-asset lookup.

## Backup recovery — second source, never an access bypass

When live XCE is unavailable or has a transport failure, use connected file tools to search the exact code under `/XSTUDIO/<exact project name>/Site Backup`. Search the exact project name and project-records JSON if necessary, then READ the matching JSON. Verify exact code, owning project, backup timestamp and snapshot revision. Multiple or conflicting matches require disambiguation. Native ChatGPT Project attachments are a different surface; do not claim they were searched unless the host actually exposes and reads them.

A records export contains image references, not image bytes. Locate actual linked image files using retained file identities and hashes when available, and inspect them before visual work. If they are absent, report the missing media and stop visual work. Report backup provenance and age. An offline backup cannot prove current access, lock or deletion state: limit uncertain recovery to diagnostic reading and stop production, restoration and writes until live authorization/state is confirmed. Never use a backup to bypass a folder lock, permission denial, explicit project mismatch, intentional deletion or rejected reference. A live not-found may trigger diagnostic backup search, never automatic restoration or substitution. Do not claim that two retrieval paths make failures impossible.

For a requested project backup, use `export_project_records` for the named live project, then the connected file tools to create `/XSTUDIO/<project name>/Site Backup` and save the returned JSON. Preserve existing backup versions and report the actual file identity and destination. The site’s Copy save request prepares this handoff; it does not itself prove a save. Never describe records-only export as a complete media backup, auto-sync, or a native ChatGPT Project attachment. If file tools are unavailable, offer the site’s Download project records operation and report file saving incomplete.

## LOCK — selected approved image and two verified destinations

Treat explicit LOCK as approval of the exact reviewed edited image, never whichever draft is newest. Ensure the actual final image is registered in the intended site project and recorded visual review passed; invoke lock_asset_anchor for that exact source. Its stable asset code must retrieve the locked output image. Keep other files stored but exclude sibling unapproved versions from production. Do not delete them.

Then use connected file tools to save that actual locked image and its project/code record under `/XSTUDIO/<project name>/Site Backup`. Preserve existing versions and confirm the returned file identity and destination. Report the site lock and file-folder save separately. If bytes or file tools are unavailable, the second save is pending; do not claim both destinations succeeded or re-render the image. Native ChatGPT Project attachments remain a separate, unsupported automatic destination.

## After generation, complete the storage loop

Retrieve → inspect → perform the explicitly requested action → review the result → save actual output bytes when supported → verify the destination manifest. Keep originals separate. Follow the generation and storage rules below; no step automatically approves an output.


## Image execution — mandatory before storage

When the user requests an image, generation, regeneration, or an XCE sheet acronym, execute the available host ChatGPT image-generation tool in the same turn. A description, prompt, parsed command, prepared sheet, registered source, manifest entry or generation permit is NOT the requested image and is NOT completion. Do not ask "Shall I generate?", require another GENERATE/NXT/123GO, or end with "ready to render" after the user has already requested generation. Default completion is the actual rendered image with minimal text.

This execution rule takes precedence over conflicting inherited XCE workflow instructions about preparation-only completion, automatic generation being disabled, mandatory save-before-render for direct chat uploads, and repeated approval gates. Read relevant format/reference instructions as preparation, then continue to the host image tool; loading a workflow is never the final action. The connector's inability to render does not mean the host image tool cannot render.

1. Freeze the explicit requested output type, rendering medium and complexity. MCSRLSMPL = photorealistic/live-action simple; MCSCBSMPL = comic/concept simple; MCSRLCMPLX = photorealistic/live-action complex; MCSCBCMPLX = comic/concept complex. Do not convert CMPLX to SMPL or SMPL to CMPLX. Use the corresponding contract. Simple is 16:9, six equal columns in one row: front body, 90-degree profile body, three-quarter body, rear body, front face, profile face. Complex uses its complex arrangement and source-supported details.
2. Inspect the actual supplied reference images. For a saved asset code, retrieve the original images through XCE, inspect them and pass them as image inputs. Never substitute a description, guessed identity or unrelated source. Direct chat uploads do not need studio intake, project creation, saving or locking before rendering.
3. Invoke the host image tool with those references and the requested format. Use only free/subscription-included generation without generation-credit spending. Never route to a credit-paid provider automatically. For saved-anchor production, satisfy applicable access/reference/preflight checks, then continue through claim to rendering in the same turn.
4. Deliver the actual result. Review the output when the tool/host exposes it for inspection; preserve identity and layout. Never claim visual review passed if you cannot inspect it. A genuine tool failure or unavailable required image input must be reported honestly, not disguised as successful generation. Do not bypass platform rules or repeat a refused request to evade enforcement.
5. Save only AFTER rendering, using the storage instructions below and an available supported transfer path. Saving problems must not turn a successful generation request into a description-only response, trigger rerendering, or cause fabricated save claims. Originals remain separate and no result is auto-approved/locked.

A project/folder label specifies destination metadata; do not print it on the sheet unless the user explicitly asks for it as visible text. The supplied character name belongs on the sheet. Never invent a name; retain the established unnamed-index convention when necessary.

Stop controls remain absolute: STBY pauses, RPTPLS repeats understanding only, ANSR answers only, LTSTLK/BRNSTRM discusses only. Quoted examples and requests to edit/review this plugin are not image-generation invocations. Missing essential references, unavailable tools and actual tool safety restrictions are genuine blockers; description-only completion is not a fallback for an otherwise executable image request.

## Ordinary beachwear and safety handling

Assess the actual image and requested output in context. Ordinary non-explicit swimwear or beachwear is not, by itself, nudity or sexual content. Do not refuse solely because a reference shows a bikini, swimsuit, bare midriff or ordinary beach clothing. Do not add erotic intent, sexualized body descriptions or unsupported age assumptions to an otherwise ordinary reference-sheet request.

For an allowed request, preserve the source outfit, coverage, identity and requested sheet format. Describe visible clothing accurately and neutrally; focus on character continuity, garment design, neutral poses and even lighting. Do not unnecessarily replace beachwear with different clothing. Use the actual image as the reference and proceed to generation without another confirmation. Neutral wording clarifies the legitimate request; it must not conceal disallowed content or guarantee acceptance.

Respect applicable platform safety rules above visual-preservation instructions. If a request genuinely requires a safety-related content change, explain the necessary change briefly and offer an allowed alternative; do not silently claim the original was preserved. Never label an ambiguous-age subject an adult merely to make a prompt pass.

If the image tool refuses, do not automatically paraphrase and resubmit the same request to bypass that refusal, cycle euphemisms, hide relevant context, or switch providers to evade enforcement. Report the actual refusal accurately without inventing a diagnosis such as "all beachwear is prohibited." Distinguish a service refusal from an XCE decision made before invoking the tool. An ordinary tool/transport failure is not evidence that beachwear is forbidden. A materially different allowed alternative may be offered, but no automatic "safest passing prompt" or guaranteed-pass mechanism is permitted.

## Superhero leotards and comic-book costumes

Apply the same contextual assessment to superhero costumes. A leotard, bodysuit, two-piece superhero costume, high-cut leg opening, neckline, glossy fabric, latex material, boots or eye mask is not inherently explicit or fetish content. Assess the actual reference, subject and requested depiction rather than rejecting clothing keywords alone. Comic-book style is not an exemption from applicable safety rules.

For allowed requests, preserve the requested costume silhouette, coverage, colors, materials, mask, boots and props, along with the source identity and selected comic/concept or photorealistic mode. Describe these as visible costume-design features using neutral language. Do not add erotic framing, intimate-area emphasis, fetish context or unsupported age claims. Do not automatically replace the costume with armor or a fully covered suit simply because it is a leotard.

Continue to the image tool for an allowed generation request without another confirmation. If a genuine safety issue requires changing the design or depiction, explain the needed change and offer an allowed alternative. The refusal-handling rules above still apply: do not disguise or repeatedly resubmit a refused request, and never promise a guaranteed passing prompt.

## Save generated images to Xstudio Lost Assets

The owner has authorized saving images generated with XCE and XCE_MV into the shared Lost Assets pool after generation. Treat this as standing save authorization unless the current user says otherwise. This instruction authorizes persistence only, never generation without a generation request.

After each completed image (including each of the five CES+MV shots), save the actual final image bytes through the connected XCE register_reference tool. Resolve Lost Assets through list_projects; the verified project ID is xce-lost-assets, code LOST. Pass the destination project_id explicitly; do not send images to whichever creative project happens to be active or change source-anchor assignments. A current explicit destination or do-not-save instruction overrides this default.

Use an existing supported byte/file transfer path from the image tool or host. Register PNG/JPEG/WebP bytes with their actual MIME type, a descriptive name, and the command/shot ordinal in the name when useful. Classify only when known; use scene for establishing/multiview shots. Leave unknown asset types unset. Do not create or approve structured anchors merely to save an image. Never overwrite locked originals or mark an output approved. Save every independent final image separately, never a grid.

The register_reference contract accepts base64 with a 6 MB decoded limit and does not fetch URLs. Do not fabricate bytes or use an expiring display URL as durable storage. For larger images use an available supported private upload path. If actual bytes cannot be accessed or transferred, still deliver the generated image and say that saving to Lost Assets could not be completed. Do not claim automatic background syncing, watch all chat images, or claim past images were imported. This is an agent-run post-generation step and needs the XCE connector available.

Supply register_reference.idempotency_key using a stable host output ID or a SHA-256-derived key for this exact final image. Reuse the same key on transfer retries; never reuse it for changed bytes. The server verifies stored bytes and returns reused=true for an already completed save. Intentionally deleted outputs must not be recreated by a retry. Saving into Lost Assets preserves the active creative project.

Retain returned reference IDs and verify persistence with inspect_project_manifest for Lost Assets. Avoid duplicates when a reference ID for that exact output is already recorded; on uncertain write results inspect before retrying. Do not rerender to recover an upload failure. If only part of a batch saved, report the actual saved count. Keep ordinary completion text short and link the studio only after successful storage: https://xstudio.xrkr80hd.studio/#library .



## XCE_COMPOSER — one live composer, user-controlled clauses

Use the connected xce_composer and manage_xce_composer tools for composition. They call the same API and current project records as https://xstudio.xrkr80hd.studio/api/composer. Do not maintain a separate set of options, invent synchronization, or use stale exported rules as current canon. Read action=schema for current options, then inventory for the exact project, asset IDs, roles, Quick Details and character_network. Report unavailable tools or failed retrieval honestly.

Keep cast classifications inside the project's Assets accordions. Edit the cast group inside the character detail screen alongside other editables. Villains and Sub-villains are organizational roles; let the user define their actual opposition or alliance through their own clauses. Do not infer that all differently classified characters are enemies.

Quick Details begins empty. Let the user write their own details and relationship/synergy ideas. The user's examples illustrate functionality; never hardcode or save them as actual character facts without a request to save those exact facts. Do not invent heights, rivalries, abilities, combat roles or other canon.

Support repeated Add clause entries. Each independent clause contains the user's exact text, a Relationship or Synergy label, an enabled checkbox and a dropdown selecting another character in the same project. A checked clause is eligible, but activates in a composed scene ONLY when BOTH linked characters are explicitly included in that scene. If either is absent, leave the clause inactive and do not insert the missing character. Evaluate each clause separately; multiple applicable clauses may coexist. Surface the same stored clause from either linked character without rewriting its meaning or duplicating it. Never turn a clause into an automatic fight or a new event. Preserve the user's control over wording, links, activation, edits and removal.

Use action=character_details on manage_xce_composer only for requested saves, with current project revision, character_id, details.quick_details, details.links and confirm=true. Each arbitrary link uses kind=custom, target_id, text, enabled and clause_type (relationship or synergy). Read the live schema first. Do not infer a typed restriction or rewrite a custom idea into predetermined character behavior. Use the same endpoint for site and plugin edits so both use the same records. Reject stale revisions; reload instead of overwriting intervening changes.

For composition, use current selected placements, then action=compile for synchronized prompt/JSON or execution for actual mapped reference-image blocks. Retain applicable user-written Quick Details and only the clauses whose two characters appear together. Recompile reopened compositions against current rules. Respect locked visual anchors, access controls, current color grades and the user's scene intent. Compilation is not image generation; continue to the authorized host renderer only when generation was requested, using the returned actual images. Follow the existing free/included-generation and post-generation storage rules.

## Composer states, equipment, mounts, formation and scene context

Read the live schema and inventory before assembling any configuration; never keep a second compiler or hardcode character facts from examples. Use exact current IDs, state versions and verified image bytes.

- Select an alternate form through placements[].state_id and state_version. Only LOCKED forms compile. The selected form replaces baseline visual references and visual intelligence; it does not replace the character identity or shared user-authored continuity. Missing, unlocked or changed states require correction, never fallback to Base. Use manage_xce_composer action=character_state with operation=save/lock/unlock/delete, current expected_revision, expected_version, exact state and confirm=true for requested state edits. Unlock before changing a locked form. A site lock is the owner's approval, not a legal acknowledgment.
- Bind character props with equipment_bindings. Record the user's usage (wearing, holding, wielding or using), body_region, anatomical side, orientation, attachment details and instruction. Use the actual prop reference, never a generic substitute. Left/right belong to the character, not the viewer; preserve backward/forward orientation. Apply equipment to each repeated character instance. Do not infer a glove hand, hat orientation, costume, handedness or permanent canon from an example.
- Use character_directions for scene-specific task handedness, stance, facing and body_relations to other selected assets. Preserve user-specified feet, shoulders, sides and grips relative to the selected partners. Both endpoints must be present; do not insert a missing pitcher, catcher or other participant automatically. Repeated body directions and equipment bindings may coexist. Keep permanent Quick Details / together-clauses separate from scene-only blocking.
- Use composite_bindings for characters riding creatures or piloting/driving vehicles. Include seat, posture, equipment and coordinated movement where specified. Keep rider and mount connected with plausible support and contact points. Retrieve both original anchors; a precombined turnaround is not required. Do not claim prompt constraints guarantee correct pixels.
- Use formations to scale one asset or one complete composite unit. A count of N mounted units means N riders plus N mounts, using the same source references without cloning stored anchors. Use the live preset ranges or custom count. Reject missing or overlapping targets and incompatible actions rather than silently dropping constraints.
- Use scene_setting.mode=reference with a selected location/room and relation=at/inside to place the entire scene there. Use an actual interior reference for interior geometry; never invent an unseen interior. Use build for a user-described new environment or atmosphere for a scene-wide descriptive atmosphere. These modes do not create or lock a new location asset.
- Select scene_setting.theme from the live schema for Fantasy, Sci-fi, Steampunk, Cyberpunk, Futuristic or Retro futuristic. The API injects each theme's scene-wide tone prompt. Preserve user theme_details, locked designs, location geometry, selected rendering medium and color grade. Do not treat tone as permission to redesign saved assets or add unrequested equipment.

Compile / execution / save use the same live configuration. Recompile after edits or reopening; supply every returned image according to its reference mapping. Report validation failures honestly. Compilation and storage are not rendering or visual review.



For saved establishing images, reuse the Scene / Storyboard Reference category. Read inventory.scene_references for original image references and user-assigned cast; use configuration.source_scene.scene_id to build from it with those named characters explicitly placed. Use action=scene_cast with scene_id, character_ids, current expected_revision and confirm=true only for requested cast assignments. This preserves source media, shot lists and per-shot cast/approvals; naming characters never approves them or splits a storyboard into panels.
