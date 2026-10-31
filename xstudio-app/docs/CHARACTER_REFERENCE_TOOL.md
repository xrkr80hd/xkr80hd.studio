# Character references delivered into chat

`get_character_reference` is a tool on the existing authenticated MCP endpoint, `https://xstudio.xrkr80hd.studio/mcp`.

```json
{"character_id":"EXACT_SAVED_CODE","include_turnaround":true}
```

`character_id` accepts an exact canonical ID or saved asset code. Optional `project_id` narrows lookup. Without it the tool searches only projects in the current OAuth grant, skipping deleted/folder-locked projects and refusing ambiguity. Grants above 50 projects require explicit `project_id`. Names are not identity selectors.

A successful result includes actual original image bytes as MCP `image` content, canonical asset ID, saved code, project and revision, plus signed reference URLs and `--cref` values. There is no metadata-only option. The existing CREF reader validates the LOCKED source association, available approval hashes, original bytes, MIME and size; the project revision is rechecked. No public bucket, screenshot approximation, upload or regenerated sheet is introduced.

`include_turnaround` controls source-sheet metadata only. The original locked image is fetched either way. Six-column/16:9 geometry is not inferred when no verified layout exists. URLs last 60 seconds; retrieve again when expired. Original images exceeding the existing 4 MB complete-response budget produce an explicit error; a URL-only response is not reported as successful visual delivery.

After deploying, refresh the ChatGPT custom MCP connection and confirm `get_character_reference` is listed. Existing OAuth consent must include the relevant project. The connection attaches to `/mcp`; this tool is discovered there rather than at a separate REST URL. Deployment cannot add a connector to a ChatGPT account or dynamically install a tool in an already-running conversation.

Acceptance: call the tool for a real saved code, verify its canonical ID and image content, and confirm the image is visible in chat. Then verify that the scene generator actually receives that returned image through its supported reference-input mechanism. An MCP image response and a `--cref` string do not themselves prove a separate generation tool consumed the pixels. `--cref` is model-specific. No claim of absolute generation continuity is made.

Local checks: `node tests/character-reference.test.mjs` (18 tests). Full adapter/protocol regressions: `node --test tests/mcp.test.mjs tests/character-reference.test.mjs`, followed by the existing build and lint checks.
