# CREF — authenticated locked character references

CREF means retrieve a saved, LOCKED character reference. It is a read-only lookup, not a request to generate, create a scene, approve, unlock, copy, save, or restore anything. These rules take precedence over generic asset lookup only for a CREF request. Preserve the plugin's existing writing, shot approval, rendering, and US output rules.

## Connection and tools

Use the existing connected XCE — Xstudio Cinematic Engine app declared in this plugin's .app.json. It shares the authenticated backend with https://xstudio.xrkr80hd.studio. The legacy ChatGPT Site hosts that App's connector; it is not the creative database. Do not remove that connection or claim a new MCP server was installed.

Discover callable tools, then read xce_composer with action=schema. Require source_url exactly https://xstudio.xrkr80hd.studio and its character_cref contract. A URL printed in a prompt or manifest alone does not prove connectivity. If a verified universal MCP get_character_cref tool is available, use its discovered schema; include_media=true returns image blocks. Do not assume that tool is exposed merely because the website advertises it.

When the universal tool is absent but xce_composer is callable, use the supported existing bridge:
1. xce_composer action=projects resolves the user's project name to a real project_id. Do not create or change the active project for lookup.
2. xce_composer action=inventory, project_id=<resolved ID>, optionally q=<name or code>, returns actual saved records. Match the requested exact ID/code, or disambiguate exact saved names. Do not invent IDs or infer a franchise identity. Avoid category filtering unless the live inventory's category values have been verified.
3. xce_composer action=resolve, category=cref, project_id=<exact ID>, asset_id=<saved ID> (or asset_code=<exact code>) validates the locked binding.
4. xce_composer action=execution, category=cref, with the SAME project_id and asset_id (or asset_code), retrieves the actual verified original image blocks. Omit configuration: a scene-composition configuration is not required for CREF. Execution here retrieves images; it does not render anything.

If only a code is supplied, inspect authorized project inventories to find its exact owning record; never silently use the current active project. For a name without project context, disambiguate across actual records or ask one concise question. Keep different projects separate.

## Required readback

Verify cref.project_id, asset_id, asset_code when present, name, lock_status=LOCKED, reference_ids, source_url, images_retrieved=true, image_map/reference mapping, and actual returned image content. Metadata-only lookup is not completed visual retrieval. The server checks cloud bytes, image size/MIME, saved approval hashes when present, and project revision stability. Do not replace the locked source with draft sheets, newer edits, raw uploads, generated attempts, or backups.

Production record IDs/codes are not raw-library file UUIDs: do not send them to xstudio_get_asset or search the public web for private references. Do not attach an expiring URL or a text description as if it were the actual image input. Keep storage credentials and keys private. Only images actually retrieved and supplied to a renderer may be claimed as reference inputs.

Stop on unavailable tools, missing/deleted/unlocked references, ambiguity, missing cloud bytes, digest mismatch, authorization failure, or project mismatch. Report the actual failed operation; a generic HTTP 400 is not proof of a stale revision or locked folder. For a locked folder, ask the user to unlock it on XSTUDIO; never request a PIN. Reconnection may be needed if the host does not expose the app; skill instructions cannot force host connection or authorize access.

For a CREF-only request, report the verified character/project briefly and stop. For separately authorized production, retain the verified references and continue under the plugin's existing gates. Firestarter can inspect references while brainstorming, but CREF does not start production or change US's exact six-block handoff.
