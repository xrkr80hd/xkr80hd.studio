# Asset classification and locked cref

## Audit

- Existing GitHub release audited: `8e4374d6ceadb8b1aa1b6c92272894aaffbe30e9`; both Vercel GitHub deployment checks succeeded.
- Vercel project inspection returned 404 under the configured team; full remote environment/configuration inspection was unavailable. No environment secrets were retrieved or changed.
- Fuchsia Lighthouse `osbsjjoxepxezcmupcak` is ACTIVE_HEALTHY. XSTUDIO owner, asset, token, project, context, code, file and OAuth-state tables report RLS enabled. This confirms RLS enablement, not a comprehensive proof of every existing policy.
- Deployed `xstudio-assets-api` is version 7. Existing authenticated owner-scoped manifest save and revision checks are reused. No database migration or Edge Function change is needed.
- Anonymous production requests to `/mcp` and `/api/composer?action=schema` return 401.
- Existing connected XCE app's live schema did not expose classifications. This release extends the website API, its OpenAPI source, and the universal `/mcp` tool definitions. A separately hosted legacy app wrapper must refresh its schema to expose these actions; it is not silently modified by this repository.

## Contract

Primary categories remain intact. `asset_details[id].secondary_classification` and `classification_version` hold the metadata, with append-only classification history. Classification does not call reclassification, prompt generation, anchor approval, or asset creation. Valid bulk items save together; invalid items return individual errors. Project revision conflict aborts the save. Locked records are supported.

Website API: `/api/composer?action=schema` discovers classifications. `classifications` reads; POST `classify` or `classify_bulk` writes using the documented schema. Existing owner session or authenticated backend token authorization applies; writes require backend write permission and expected project revision.

Universal MCP tools: `get_asset_classifications`, `update_asset_classification`, `bulk_update_asset_classifications`, `get_character_cref`. Existing list/get responses also include classification metadata. Classification writes require `asset:read asset:classify`, selected-project consent, expected revision/version and `confirm:true`. Old read-only OAuth sessions remain read-only. Reconnect with the additional scope to obtain explicitly consented access. API grants likewise require explicit configured classification scope and a write-capable upstream credential; no existing grant is upgraded automatically.

`cref` accepts only LOCKED characters with an exact saved `source_image_id`; it rejects draft/unlocked records, missing source images, diagnostic images, draft/unlocked reference flags and mismatched approval reference IDs. It never substitutes a draft source. Optional signed URLs expire after 60 seconds. A cref is a structured XSTUDIO reference binding, not a promise that every external image platform accepts the same syntax.

## FF6 inventory verification (read-only)

Live project `final-fantasy-vi`, revision 162:

| Saved name | Exact ID | Proposed classification |
| --- | --- | --- |
| Shiva - Esper | FF6-CR-SHIVA-ESPER-v1 | Magical Being / Esper |
| Ifrit - Esper | FF6-CR-IFRIT-ESPER-v1 | Magical Being / Esper |
| Ramuh | FF6-CH-RAMUH-v1 | Magical Being / Esper |
| Maduin | FF6-CH-MADUIN-v1 | Magical Being / Esper |
| Tritoch | FF6-CR-TRITOCH-v1 | Magical Being / Esper |
| Mog's Sword | FF6-PR-MOG-S-SWORD-v3 | Weapon |
| Strago's Staff | FF6-PR-STRAGO-S-STAFF-v3 | Weapon |
| Buzz Saw | FF6-PR-BUZZ-SAW-v2 | Weapon |
| Bio Blaster | FF6-PR-BIO-BLASTER-v2 | Weapon |
| Slave Crown | FF6-PR-SLAVE-CROWN-v2 | Equipment |

Additional distinct records: `FF6-CR-IFRIT-v2` (Ifrit), `FF6-CR-FF6-ESPER-TRITOCH-NEEDS-TO-BE-GENERATED-CORRECTLY-v1` (Tritoch variant marked for regeneration). No variants were merged and no live FF6 records were changed during verification.

## Validation limits

Tests exercise actual website API handler -> actual MCP SDK over HTTP -> API reload using isolated in-memory persistence, plus the existing OAuth suite, metadata invariants, partial failures, stale revisions, project boundaries and cref rejection cases. Real production classification writes and phone visual checks were not performed. Deployment and a newly authorized MCP connection are required for live write verification.

## Character metadata repair

The reproduced `character_details` HTTP 400 was an empty/partial payload rejected by a contract that required both `quick_details` and `links`. The legacy wrapper returned a generic HTTP error that hid the validation reason. The original failing payload was unavailable, so this is the reproduced cause, not a claim about every historical failure. Partial Quick Details now preserve omitted relationships; unsupported fields report precise errors; supported metadata persists separately from immutable anchors. Creatures are included in character details.

New universal tools: `get_project_classification_schema`, `get_asset_details`, `update_asset_details`, `bulk_update_asset_details`, `get_asset_generation_prompt`, `update_asset_generation_prompt`. Metadata writes require explicit `asset:metadata` consent, project authorization, expected project revision and metadata/prompt version. Bulk metadata supports independent authorized project batches with per-project and per-record errors. Unknown records are never created. Locked folders are skipped. Existing grants do not gain write access automatically.

The website API adds `metadata_read`, `metadata_update`, `metadata_bulk`, `generation_prompt`, and `generation_prompt_update`. Discover fields in its live `schema` response or the generated OpenAPI document. Metadata, history and reusable prompt versions use existing project JSON storage; no SQL migration is required. Reusable prompts retain the original saved generation prompt and previous versions. FF6 prompt policies specify live-action cinematic realism and locked-source authority. The generation renderer is not replaced.

Character cards reuse existing accordions for Character Details, Generation Prompt and Reference / Approval Status alongside existing Quick Details and Relationships. The creation and editing paths share the Realistic/CB selector. Classification appears on existing cards and in library filtering/grouping and bulk actions.

Additional read-only inventories verified: startropics revision 30 and RAC revision 12. No production story/asset metadata was changed during these checks. API/MCP integration tests use isolated persistence and verify save/readback, original prompt retention, revision conflicts and authorization boundaries. A production write/readback test and phone visual QA remain unperformed.

The separately hosted legacy Sites wrapper source could not be opened by the source helper ("Unable to prepare the Site"). Its connector schema and generic error handler were not published or changed. The canonical website API and universal `/mcp` implementation are repaired here; the legacy wrapper may still advertise only its old operations until its own schema is refreshed.
