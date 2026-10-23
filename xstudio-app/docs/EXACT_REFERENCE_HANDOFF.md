# Exact character image handoff investigation

2026-10-21. Inspected branch `codex/xstudio-private`, base commit `343cfa846ec1c33046ae30128f4e056d49bfb41c`. Changes are local and uncommitted. No push, deployment, storage-policy change or asset mutation was performed.

## Findings and trace

1. Discovery: `lib/mcp/server.mjs` registers `get_character_cref` (media defaults true), `get_character_anchor` (false), and metadata-oriented lookup tools. The connected XCE app in this conversation exposes the composer bridge and identity tools, but neither universal character tool. That establishes a discovery difference, not proof that its tools are stale: the bridge is a separate integration. Its live schema explicitly advertises `get_character_cref` and composer CREF execution.
2. Projects: universal `dataSource.project()` checks the authenticated grant's explicit project set before loading anything, and excludes deleted/folder-locked manifests. Lookup requires an explicit project. `find()` matches exact ID or exact asset code, rejecting zero/multiple results; substring search is discovery only. No name or active-project fallback is used. Instructions now require discovering the owning authorized project and asking on ambiguity. This is model routing guidance, not a new cross-project resolver or a guarantee of model compliance.
3. Canonical identity: `codedRecords()` merges native world-library and legacy manifest records with existing canonical ID precedence. `characterCref()` requires one exact character, LOCKED status, its exact `source_image_id`, an available non-diagnostic/non-draft source and matching approval reference when recorded. It does not choose the first gallery image. Existing legacy locked records without approval hashes remain supported; no new approvals are manufactured.
4. Authorized image read: `prepareCharacterCref()` obtains only that manifest-associated key through `referenceReader()`. The existing owner-scoped Edge API `supabase/functions/xstudio-assets-api/engine.ts` looks up the real owner's engine file before issuing a 60-second private signed URL. The reader restricts origin and bucket path, refuses redirects, bounds reads, and uses timeouts. Expired/failed downloads are errors; retry the exact lookup to get a fresh signed capability, never substitute another source.
5. Integrity: CREF validates size, PNG/JPEG/WebP signature, declared MIME and stored approval/reference hashes when present; universal retrieval rechecks the project revision after download. No signing credential, backend token or storage path is returned by CREF.
6. MCP response: previously `get_character_anchor` returned metadata/URLs and was excluded from the server image-block allowlist. Only CREF and identity tools emitted image blocks. This is the confirmed server-side pixel handoff gap. Descriptive metadata success could be mistaken for completed visual retrieval. Generic reference tools retain their documented metadata behavior.
7. Client: an MCP image block is actual bytes delivered to a compatible client. It is not evidence that a separate generator received an image reference. No inspected OpenAI documentation guarantees automatic connector-image forwarding into ChatGPT image generation. The available generation tool accepts recent conversation images or explicit local reference paths, but no generation invocation was made to verify that second handoff.

## Minimal correction

- Keep CREF as the preferred exact character tool, improve its discovery description and MCP initialization instructions.
- Route `get_character_anchor` through the same CREF implementation, including metadata-only validation. With media true emit actual image blocks; preserve its false default and explicit metadata-only option.
- Preserve canonical metadata fields while adding the CREF identity and verified image result. Missing source associations now fail explicitly rather than returning a successful partial locked-anchor response.
- Preserve the 1.5 MB metadata-text limit and bound the complete tool-result envelope to 4 MB, including base64 and duplicated structured data. Previously image bytes bypassed the size check. Shared original reads remain capped at 6 MiB; the envelope limit can reject a smaller original after base64 expansion. Never downsample or reinterpret a locked original to fit.
- No record, lock, approval, project grant, bucket or production setting is altered.

## Evidence and verification boundaries

| Surface | Observed result |
| --- | --- |
| Local exact-image implementation | All 411 tests pass; focused suite contains 61 tests. Existing character-reference/HTTP tests included. |
| Local lint | Modified source and test files pass ESLint. |
| Regression coverage | Exact codes; native/legacy records; exact approved source instead of gallery; actual MCP image bytes; metadata-only without downloads; unauthorized projects before lookup; ambiguous code; draft/missing/deleted/diagnostic references; approval/hash mismatch; revision drift; failed downloads/expired capabilities; MIME and size failures; full-envelope limit. |
| Live bridge connection | Schema and project inventories returned source `https://xstudio.xrkr80hd.studio`. No universal MCP OAuth grant was created. |
| Live exact Gau lookup | Authorized unlocked inventories yielded one exact match: project `final-fantasy-vi`, record `FF6-CH-GAU-v2`, code `FF6-CH-GAU`, name Gau, LOCKED, revision 177. Locked Personal project was skipped. |
| Live original-image delivery | Composer resolve then execution with category `cref` returned original PNG image block mapped to `FF6-CH-GAU-v1`, with `images_retrieved=true`. The actual six-view Gau sheet was visible to the assistant in this conversation. This is stronger evidence than a URL, description or metadata preview. Live bridge response did not expose a digest for independent comparison; its source implementation validates saved hashes when present. |
| Live universal MCP endpoint | Unauthenticated tools/list returned 401 Authentication required. Authenticated production universal discovery/retrieval was not tested. |
| Vercel production source | Connected team's get_project for `xstudio-private` returned 404; filtered project listing returned `studio-production-suite`. This does not establish that production is missing or moved. Actual deployed commit remains unverified. |
| Generation reference delivery | Unverified. No image was generated; no claim that a renderer consumed Gau's PNG. |
| Release | Nothing committed, pushed or deployed. Local patch is not a verified production fix. |

## Connector refresh and client acceptance

After an approved deployment/restart, open the direct custom MCP connection in ChatGPT Plugins, select Refresh, confirm `get_character_cref` and its updated media schema/description, then start a new conversation. If the current host uses Apps/Connectors terminology, use that connection's equivalent tool refresh. Reconnect with OAuth only if access has expired or the intended project was not granted; approve the intended projects. Do not delete the legacy app/site merely to refresh the separate universal endpoint.

For the existing XCE bridge, use schema → projects → inventory → resolve(category=cref) → execution(category=cref). Resolve alone explicitly returns `images_retrieved=false`. Execution is the actual-image step and requires no scene configuration. This path worked for Gau during this investigation.

Acceptance for generation must record separately: (a) exact project/asset/code/locked source and delivered image bytes; (b) the renderer request actually includes that retrieved image through the host's supported image-reference mechanism. Visual resemblance alone cannot prove (b). If the host cannot forward connector images, stop and download the exact approved original from XSTUDIO, attach it directly in the ChatGPT message, and use that attachment as the reference. Do not regenerate an approximation as a workaround.

## User prompt

Reference FF6-CH-GAU from Final Fantasy VI. Retrieve its exact locked anchor with get_character_cref and media enabled, or XCE composer CREF execution. Use the original image as the identity reference for my requested edit. If you cannot pass that image to the generator, stop and tell me; never substitute a description, draft, or similar character.

## Official documentation inspected

- https://developers.openai.com/plugins/build/mcp-server — MCP server/tool-result integration. This does not establish automatic image forwarding to generation.
- https://developers.openai.com/plugins/deploy/connect-chatgpt — refresh metadata after deployment, confirm changed tool metadata, start a new conversation.
- https://developers.openai.com/api/docs/guides/custom-mcp-server — custom MCP connection and discovery.
- https://developers.openai.com/api/docs/guides/tools-image-generation — image generation uses provided image inputs. API guidance is not proof of ChatGPT connector-to-generator behavior.

The supplied PDF is historical configuration evidence (2026-10-14), references a legacy site and explicitly says inconsistent transfers remain unverified. Its stated destination is not authoritative for current deployment.
