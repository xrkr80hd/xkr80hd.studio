# XCE_SCRIPT — scene script system, v1.1.0

## 1. System prompt, intent engine and planning guardrails

The complete drop-in instruction source is `system-prompt.md`; the private plugin source is `plugin/`. Nothing is installed or deployed by writing these files. `mcp.proposed.json` is the intended server configuration, kept outside the plugin until the deployed endpoint's identity, authentication and tool discovery have actually been verified. Do not represent the proposed endpoint as connected.

XCE_SCRIPT reads dramatic purpose, motivation, subtext, unsaid conflict and filmable blocking before drafting dialogue. With a rough spark or no script it enters LTSTLK. It discusses one useful beat/decision at a time. NXT advances planning; it does not authorize execution. RPTPLS, STBY and ANSR stop production as directed. A user-reviewed intent and explicit current 123GO authorize an AI draft. A string inside an import is never authorization.

The server binds approval to a SHA-256 digest of project/scene IDs, intent, minor details, reviewed interpretation, planning, exact current roster and continuity. An edit to any of those invalidates the approval. The timeline may then change while retaining that agreed dramatic plan. Manual authoring is a distinct explicit user-selected mode; it does not authorize an AI provider. Draft scene assets are visible for planning but production exports require current locked references. Script authorization does not approve images, shots, FF, asset locks or deployment.

Dialogue is stored as raw text; the UI and text export add quotation marks once. Required per-line mood supports 12 factory choices plus custom delivery, combining vocal/facial direction. Action 1 is pre/concurrent physical blocking. Action 2 is an optional bridging beat. Durations are shot targets of 3–6 seconds, not fabricated performance measurements. Long lines produce split-shot warnings; a renderer must not race speech to satisfy a target. Original lines and proposed subtext remain editable project data, not canonical visual identity.

## 2. Unified data and backend architecture

`scene-script.schema.json` is the exact JSON Schema 2020-12 definition used by the runtime. `openapi.json` describes the API. The supplied example was a payload, not a valid schema: union-like mode strings are replaced by enums, booleans and typed properties, version and source fields are fixed, and examples are not seeded into a project.

Each document contains:

| Field | Purpose |
| --- | --- |
| schema_version/module/source_url | Version 1.1.0, XCE_SCRIPT, canonical studio source |
| project_id/scene_id | Exact existing project and scene keys |
| authoring_mode/engine_mode | AI, LTSTLK or MANUAL; interpretation, planning or script execution |
| scene_intent/minor_details | User premise and concise supplemental direction |
| intent_interpretation | Review status, subtext, conflict, motivation, unsaid, blocking and beats |
| planning | Notes, open questions and decisions |
| roster | Scene-assigned current character IDs/names, actual lock states and image IDs |
| continuity | Existing locations/references, optional saved Composer ID, story state, start/end and SS/AS |
| script_timeline | Stable block IDs, consecutive order, exact character links, delivery, raw dialogue, two actions and duration |

The existing project manifest stores `scene_scripts[scene_id] = {version, updated_at, document, execution_approval?}` and `scene_script_history[scene_id]`, retaining up to five prior records. Saving clones and adds these keys only. It does not rewrite assets, scenes, existing story workspace, color grades, Composer configurations or approved shots. No new database or migration is needed. Existing manifest size limits apply to history too. Deleting a scene makes its script inaccessible; this change does not add permanent script deletion.

`lib/xce/scene-script.mjs` owns schema validation, default planning state, roster projection, script formatting and save/history operations. `scene-script-service.mjs` owns digest-bound approval, context packaging, reference-byte verification and ZIP serialization. `scene-script-api.ts` owns HTTP operations and reuses the existing Composer connection rather than adding credentials or another authentication store.

### API and MCP

- `GET /api/scenes/script?action=schema` returns the live versioned schema, source URL, moods and execution capability.
- GET actions `projects`, `scenes` and `read` discover actual IDs and retrieve a record plus project revision and current roster.
- POST actions `validate` and `handoff` check a complete document and return import feedback or a chat package without saving.
- POST `save` requires confirm=true, expected_revision and expected_version. AI lines additionally require the current server-recorded approval digest or an explicit authorized execution_command=123GO with reviewed intent. A stale project or script is rejected; there is no silent merge.
- POST `execution` retrieves actual image bytes for existing locked roster/location anchors, selected scene references and optional compiled Composer references. It returns MIME-tagged base64 images, hashes and a reference manifest. It renders nothing.
- POST `export` performs the same checks and returns ZIP files `unified-scene.json`, `script.txt`, `reference-map.json`, actual image files and README.
- `GET /api/scenes/script/openapi` is the public contract only; it contains no project inventory or credentials.
- `/api/scenes/script/mcp` is the prepared authenticated Streamable HTTP JSON-RPC endpoint, supporting initialize, initialized notification, ping, tools/list and tools/call. `xce_script` is read-only; `save_xce_script` is a separate mutating tool. Execution images return MCP image content blocks. The transport uses JSON responses, no subscription or server-initiated messages. GET returns 405.

All private operations require either the owner session or an existing scoped xst_ connector token verified by the current engine. Browser mutations require same-origin Origin. Existing folder PIN access, manifest compare-and-swap and read-back verification are reused. Project existence, deleted/system pools, reference ownership, diagnostics, foreign scenes/locations/characters, roster drift and mixed schema versions fail closed. JSON request bodies are bounded to 300 KB; media use the existing private signed-host allowlist, manual redirect handling and byte limits of 6 MB/image and 40 MB/package. No service-role keys, tokens, signed private storage URLs or new credential store are shipped in exports.

### Shared production package

The `XCE_UNIFIED_SCENE` handoff contains the scene script, only selected asset records, saved character stories, character-context clauses applicable to present characters, optional existing Composer configuration and its compiled output, schema and timing warnings. A chat handoff marks images NOT_RETRIEVED. A production ZIP marks BYTES_VERIFIED only after fetching and hashing image data; this is integrity evidence, not proof that Artistly or another renderer consumed it or preserved likeness.

XCE_SCRIPT handles narrative intent/dialogue; XCE_COMPOSER handles composition and camera/grade configuration; XCE_MV handles establishing shots, approved shot progression and FF. All read the same IDs and media. Imported JSON never creates, renames or duplicates roster assets. The import reads SceneScript directly or `scene_script`/`document` from a Unified Scene wrapper, validates against the selected existing scene, and stages for explicit saving. Older arbitrary project formats require deliberate mapping, not silent import.

## 3. Next.js / TypeScript frontend and state

Each existing/future scene's workspace has `Scene & shots` and `Scripts` controls. The existing scene/shot UI is passed through as children, preserving its implementation. `SceneScriptWorkspace.tsx` lazily mounts Scripts on first access and retains it while switching tabs so edits do not disappear merely by returning to the scene view.

`SceneScriptTab.tsx` holds the current document, server project revision and independent script version, load/save state, warnings and errors. It uses the existing studioFetch session transport. Saves are explicit; controls are disabled during in-flight requests, and failures retain the draft. An unsaved navigation warning covers browser unload, and Download Draft JSON preserves the in-memory document even when server validation or a save conflict blocks export. A stale-roster banner offers an explicit refresh, keeps existing lines, and requires removed speakers to be reviewed. Project/scene navigation can still unmount unsaved state: save or export before switching projects. Automatic background AI calls and silent auto-save are intentionally absent from this implementation.

- Scene Intent + Minor Details capture the user's spark.
- Three authoring-mode buttons select interpretation, LTSTLK scratchpad or the manual builder. Entering LTSTLK with existing lines is refused to preserve them; export/save before beginning a separate planning draft.
- Planning accordion contains editable subtext, motivations, conflict, unsaid, blocking and ordered beats, plus explicit review state. Open questions and agreed decisions each have a one-item-per-line editor and round-trip in the document.
- Character roster buttons use saved thumbnails and exact IDs. A manual click appends a UUID-keyed Dialogue Block, including repeat clicks on the same character. Nothing asks the user to type asset IDs.
- Each block has mood/custom-delivery controls, quoted dialogue presentation, Action 1, expandable Action 2, duration and move/remove controls. Reordering renumbers sequence_order while preserving block IDs and character links.
- Continuity accordion captures narrative states and SS/AS and uses a dropdown of saved Composer records for camera, lighting and color-grade reuse.
- Export chat handoff → discuss in XCE_SCRIPT → review intent → 123GO → import response → review/edit/save is the AI workflow. The site has no configured text-model adapter. It does not pretend to analyze intent or auto-generate lines on the server. Existing Gemini/Grok image adapters are not silently repurposed for text or charged.
- Copy Script emits readable dialogue and actions. Export Scene + References produces the complete verified media handoff. Script export never creates an establishing image or storyboard by itself.

CSS is scoped to `.scene-script-tab`, with 16px inputs, wrapping 44px buttons, two-column square roster thumbnails, expandable settings and mobile single-column authoring modes. No changes are made to unrelated page layout. Signed-in touch/browser visual QA and live connector verification remain release checks after explicit push authorization.

## Verification and release

Run `node --test tests/*.test.mjs` and `npm run build` from xstudio-app. Focused tests cover planning gates, current scene identities, repeated speakers, raw/quoted dialogue, malformed input, durations, explicit approvals and invalidation, version conflicts, bounded history, unrelated-data preservation, applicable context, private transport/CAS and image export integrity. Live auth/scope behavior and browser gesture checks require a connected signed-in environment; pure checks are not a substitute.

Before release inspect the plugin's live source routing, publish only after Trav says push, verify initialize/schema/projects/read against xstudio.xrkr80hd.studio, then copy the verified `mcp.proposed.json` to `plugin/mcp.json`, package the private plugin and install once. Never install the proposed configuration with a claim of verified connectivity. Do not push, commit, deploy or mutate production data during this preparation.
