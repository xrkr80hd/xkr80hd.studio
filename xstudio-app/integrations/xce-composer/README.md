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
