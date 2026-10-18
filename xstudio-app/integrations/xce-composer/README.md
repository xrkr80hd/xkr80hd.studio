# XCE_COMPOSER · prepared integration

New native module, version 1.0.0. This folder is an integration package, not an installed/published ChatGPT plugin. No production changes are authorized by its existence.

## Secure interface

Import `openapi.json` (also served at `/api/composer/openapi`) into an authorized API connector after deployment. Base URL: https://xstudio.xrkr80hd.studio. Use the existing named, revocable XSTUDIO token with asset:read scope; writes additionally require asset:write. Browser requests use the verified owner session, with trusted-origin checks on POST. Locked folders require their existing unlock cookie; a connector does not bypass a PIN lock. Never place credentials in prompts or exported packages.

1. GET /api/composer?action=projects (does not select/create a project).
2. GET ?action=inventory&project_id=… returns exact asset IDs, approval status, existing grades, saved composition summaries and intelligence.
3. POST action=compile with project_id and configuration validates locked anchors and downloads the actual private images. Returns schema-validated synchronized prompt/JSON and image SHA256 hashes. It does not render.
4. POST action=execution with the same configuration returns the output plus individually mapped PNG/JPEG/WebP image_base64. Attach these actual images to an authorized renderer. Do not claim image access merely from the prompt's source URL. Only use the user's authorized free/subscription-included generation path; never silently consume paid credits.
5. POST action=save, name, configuration, expected_revision, confirm=true. Editing additionally supplies id and expected_version. POST duplicate supplies source id, expected_version, new name, expected_revision, confirm=true. Both reverify current references. Save read-back verifies the stored manifest. GET read&project_id=…&id=… retrieves the configuration; compile/execution revalidates current locks.
6. Browser POST export returns a ZIP with original image bytes, reference-map.json, prompt.txt, composition.json. No private storage keys or credentials are exported.
7. POST intelligence stages a profile with asset_id, profile, expected_revision/version and confirm=true. Only a subsequent approve=true call matching the saved draft locks supplements. Fields: visual_description, dimensions_proportions, clothing_textures_materials_colors, environment, history_background, locked_identity_properties, verified_facts, visual_observations, ai_suggestions, research_sources, supplemental_details. Approved supplements remain subordinate to original identity/visual locks.

## Research

GET research&project_id=…&asset_id=… prepares a research brief for approved external research tools. It does not perform online research. User-reviewed observations/facts/cited sources/suggestions are stored separately from anchor data. No existing canon, grade or anchor is overwritten.

## Persistence and safety

Compositions and intelligence are additive fields under the existing project manifest's composer key. Compositions store configuration, references remain existing inventory records, grades remain original grade IDs/version references. No new database, migration, sample assets, or active-project mutation. Optimistic project and record revisions reject conflicts. Configuration history is bounded to ten prior versions. No automatic restores or deleted-file recovery. Reference byte checks prove retrieval and integrity, not semantic visual fidelity or zero generation drift.

The OpenAPI operations are a prepared API-based plugin interface, not a new MCP transport or a live registered plugin. Existing XCE_MV/MCP tools are untouched.

## Scene descriptions and speed presets

Composer includes 415 grouped base choices across 15 camera/environment/lighting/action fields, including 125 terrains and 106 architectural styles, plus 116 stackable details across terrain features, architecture features, weather layers and scene elements. Custom values remain plain configuration strings, so existing saved scenes and approved-asset guidance are retained. The optional configuration.scene_action field supplies an overall action; assets with action="as described" follow it, while explicit per-asset actions remain authoritative. Earlier configurations without scene_action are accepted and normalized to an empty action.

Every newly compiled or previewed prompt includes ACTION DESCRIPTION guidance to clarify the supplied movement, direction, speed, timing and interaction only when useful, preserving intent, selected assets, relationships and locked references. It does not authorize new story events, props, characters or generation. The same action_guidance is included in generated JSON and retained in image+prompt exports.

The optional configuration.scene_details object stores terrain_features, architecture_features, weather_layers and elements as arrays (maximum 20 each). Select multiple additions to combine desert + ruins, or overcast + rain + mist. Earlier configurations without scene_details remain valid. Write here is near the top of each main preset dropdown and preserves existing custom prose. Details remain subordinate to approved reference geometry and visual locks.

Optional configuration.world_inspiration accepts a named or custom world (FF6, StarTropics, or another setting). It is included near the end of the natural prompt and stored in JSON/save/export. Inspiration affects broad mood and world feel only; approved asset designs and the selected rendering style remain authoritative.

The installed XCE plugin exposes xce_composer and manage_xce_composer through the existing connector. Both proxy this exact API; they do not keep a separate compiler or copied rules. Read action=schema for current options, inventory for current roles and character_network, and execution for actual image inputs. Saved compositions store configuration; recompilation resolves current project continuity. Quick Details and linked height/opposition rules live at project scope. Cast groups include Villains and Sub-villains; roles alone never imply a fight. Quick Details starts empty. Users write arbitrary rules and optionally link another project character; the identical text is available from either character and included when both are selected. No character names, sample heights, rivalry or lore are preloaded. Legacy typed height links remain readable and validate contradictions. Only characters selected together receive pair rules in the output.

## Entity composition architecture

The site and connected plugin compile through `/api/composer`; the connector forwards configuration and returns the API's exact verified images. No second prompt compiler, storage backend or renderer is introduced.

Contracts are in `lib/xce/entity-composition.ts`. Executable JSON schemas live in `entity-composition.mjs` and `scene-context.mjs`; `node integrations/xce-composer/sync-schemas.mjs` updates the OpenAPI, composition schema and standalone entity schemas. Older configurations remain valid because additions are optional.

Alternate forms live at `manifest.state_variants[character_id][state_id]`. Each has a name, independent DRAFT/LOCKED state, version, 1–6 references when locked and user-authored appearance. State writes reuse owner/bearer authentication, folder access, manifest revision CAS and readback. Save, lock, unlock and delete are separate operations. Locked records reject edits until unlocked; baseline anchors remain intact. Uploaded sheets use the existing private image upload. Assigned alternate references are protected from deletion and appear attached in the library.

Compilation resolves unique project anchors and their dependencies, selects locked state references instead of baseline visual metadata, validates mount/equipment/formation/location endpoints, downloads and hashes the exact bytes, then emits one prompt and matching JSON/reference map. Selected state versions reject stale state edits. Shared character clauses still activate only when both linked characters are explicitly placed. Scene-only stance and body directions never become permanent character facts.

Mount bindings retain separate character and creature/vehicle anchors and inject support, seat, posture, rigging and contact instructions. Equipment bindings independently identify usage, body region, anatomical side, orientation and exact prop. Contradictory spatial relations/actions fail compilation. Formations describe repetition of prototypes without creating duplicate library assets; N mounted units means N characters and N mounts. Counts are integers from 1 to 100,000; named tiers use the user-requested cinematic ranges, rather than real-world military organization standards. Prompt directions cannot guarantee pixel-perfect counts, anatomy or contact; rendered output still needs visual review.

Scene setting supports a newly described location, an exact saved location/room governing the entire scene, or a surrounding atmosphere. Reference mode requires a selected locked anchor. Interior prompts require an interior/room reference; metadata validation cannot determine whether an uploaded image actually shows interior geometry. Themes share one prompt registry and govern scene tone without replacing visual locks, rendering medium or the chosen grade.

Native controls use the existing charcoal containers, highlighted borders and rectangular buttons. All new accordions start closed. Equipment and body directions stack labels above their inputs; long text areas occupy the full card width. Removing assets clears their dependent mount, equipment, formation and body-direction entries. Closing an editor child returns to the Character Detail View; closing that parent closes the dialog completely.

Verification: Node tests exercise exact reference substitution, locked-state versions, bytes, malformed/foreign endpoints, all formation boundaries, mounted unit counts, save/reopen, anatomical side/orientation, body partners, location scope, all theme prompts, and attachment deletion guards. Production checks include TypeScript and the Next webpack build. Connector tests verify unchanged configuration forwarding and actual reference image blocks.

Saved scene/storyboard references remain in the existing Scenes & shots library. Scene creation and detail editing support named cast linked to current project characters, preserving original images and existing shot approvals. `scene_cast` updates assignments through the same revision-checked API. Inventory includes `scene_references`; optional `source_scene.scene_id` retrieves actual scene image bytes in a compiled bundle, requires its named cast to be explicitly selected, and treats that image as composition evidence rather than a replacement character identity anchor. The scene editor separates help text from a sticky Cancel/Save footer.
