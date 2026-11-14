# MCP File Pickup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three XStudio MCP tools, `import_world_zip`, `import_image_file` and `save_script`, so ChatGPT can hand over files by link and save scripts as text, and each ZIP fills only what a world is missing.

**Architecture:** A guarded downloader (`lib/mcp/file-fetch.mjs`) turns a ChatGPT file param into bytes on the server. Pure helpers (`lib/xce/world-zip-import.mjs`) unzip safely and merge script drafts into the Story workspace. `lib/mcp/workspace.mjs` wires the three tools with the existing load/save/revision checks and the existing `file_put` storage path. `lib/mcp/server.mjs` registers them with `_meta["openai/fileParams"]`.

**Tech Stack:** Next.js 16 route runtime (Node), `@modelcontextprotocol/sdk` 1.32.1, `zod`, `fflate` 0.8.3, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-14-mcp-file-pickup-design.md`

## Global Constraints

- Branch `claude/mcp-file-pickup`; all paths below are under `xstudio-app/`.
- File param shape: object `{download_url:string, file_id:string, mime_type?:string, file_name?:string}`; `download_url` and `file_id` required. Tool `_meta["openai/fileParams"]: ["file"]`.
- Downloads: `https:` only; refuse private, loopback, link-local and reserved IPs (IPv4 and IPv6); at most 3 redirects, re-checked each hop; 20 s timeout; never send XStudio credentials.
- Byte caps: images 2 500 000 (`MAX_IMAGE_BYTES`); ZIP 40 MB (41 943 040); unzip max 400 entries and 120 MB uncompressed total.
- Images are accepted only if `imageMime(bytes)` returns PNG, JPEG or WebP. ZIPs must start with `PK\x03\x04`.
- World ZIP import is fill-only: `applyRecords(..., {choices:{}})`. Never overwrite saved text, never lock or approve, never delete.
- Image import time budget: 45 000 ms, then stop and report the remainder.
- Story workspace limits come from `validateStory` (200 drafts, 150 000 chars per body, 1 MB total, title ≤ 200).
- All three tools need scope `asset:write` and `confirm: true`. They refuse system pools, folder locks and projects outside `auth.projects`, exactly like the existing write tools.

## Review Focus

1. **Same ZIP sent twice:** the second run creates no records, adds no images and adds no drafts, and reports them as skipped. Test in Task 4.
2. **ZIP world name matches two worlds:** stop with `mode:'ambiguous'` and the candidate list; write nothing. Test in Task 4.
3. **Image for a locked asset:** `attachImage` throws. Catch it per image, report it under `skipped_locked`, and keep importing the rest. Test in Task 4.
4. **Image over 2.5 MB inside a ZIP (`too_large`):** skip and report under `too_large`; it is not a failure. Test in Task 4.
5. **ChatGPT omits `mime_type` and `file_name`:** works anyway, because the type is sniffed from bytes and the name defaults to `file_id`. Test in Task 3.

---

### Task 1: Guarded file download

**Files:**
- Create: `lib/mcp/file-fetch.mjs`
- Test: `tests/file-fetch.test.mjs`

**Interfaces:**
- Produces: `export async function fetchFile(file, {maxBytes, fetchImpl=fetch, lookup=dns.promises.lookup, now=Date.now}) -> Promise<Buffer>` (throws `Error` with user-readable messages); `export const ZIP_MAX_BYTES = 41_943_040`; `export function isPublicAddress(ip:string) -> boolean`.

- [ ] **Step 1: Write failing tests** in `tests/file-fetch.test.mjs`:
  - `rejects non-https`: `fetchFile({download_url:'http://x.test/a',file_id:'f'},{maxBytes:10})` rejects `/https/`.
  - `rejects private addresses`: `lookup` resolving to each of `127.0.0.1`, `10.0.0.5`, `169.254.169.254`, `192.168.1.1`, `::1`, `fd00::1` rejects `/not allowed/`; `isPublicAddress('8.8.8.8')===true`.
  - `re-checks redirects`: a fake `fetchImpl` returning 302 to `https://internal.test/` whose lookup is `10.0.0.1` rejects `/not allowed/`; a fourth redirect rejects `/redirects/`.
  - `enforces byte cap while streaming`: a body of 11 bytes with `maxBytes:10` rejects `/too large/`.
  - `returns bytes and sends no credentials`: the fake fetch asserts `init.headers` has no `authorization`/`cookie`, and the result equals the body.
  - `requires download_url and file_id`: a missing field rejects `/file/`.
- [ ] **Step 2: Run** `node --test tests/file-fetch.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `fetchFile` with `redirect:'manual'`, a manual redirect loop (max 3, resolve and check each host), `AbortSignal.timeout(20000)`, and reading `response.body` chunks while summing length against `maxBytes`. `isPublicAddress` covers IPv4 private, loopback, link-local, CGNAT `100.64.0.0/10`, `0.0.0.0/8`, multicast and reserved; IPv6 loopback, `fc00::/7`, `fe80::/10` and IPv4-mapped addresses.
- [ ] **Step 4: Run** `node --test tests/file-fetch.test.mjs`. Expected: all pass.
- [ ] **Step 5: Commit** `feat(mcp): guarded server-side file download for ChatGPT file params`.

### Task 2: Safe unzip and script drafts

**Files:**
- Create: `lib/xce/world-zip-import.mjs`
- Test: `tests/world-zip-import.test.mjs`

**Interfaces:**
- Consumes: `fflate.unzipSync`, `validateStory`/`emptyStory` from `lib/xce/story.mjs`.
- Produces:
  - `unzipPackage(bytes:Uint8Array) -> Record<string,Uint8Array>`: throws `Not a ZIP file`, `ZIP has too many files`, `ZIP is too large when unpacked`, `Unsafe path in ZIP`.
  - `scriptDrafts(files) -> {kind:'script'|'story'|'notes', title:string, body:string}[]`
  - `mergeScriptDrafts(story, drafts, manifest) -> {story, added:string[], same:string[], kept:string[]}` (fill-only)
  - `upsertScript(story, {title, body, kind}, manifest, newId) -> {story, id:string, action:'created'|'updated'|'unchanged'}`

- [ ] **Step 1: Write failing tests:**
  - `unzipPackage` round-trips a `zipSync` archive; rejects bytes not starting `PK\x03\x04`; rejects 401 entries; rejects an entry named `../evil.txt` or `/abs.txt`; rejects an uncompressed total over 120 MB (use a filter callback on `originalSize` so nothing large is allocated).
  - `scriptDrafts`: `scripts/Ep1 Cold Open.md` → `{kind:'script', title:'Ep1 Cold Open'}`; `story/Pitch.txt` → `story`; `notes/x.md` → `notes`; `Pilot-script.txt` at the root → `script`; `README.md` at the root → ignored; `scripts/a.png` → ignored; non-UTF-8 or body over 150 000 chars → ignored with no throw.
  - `mergeScriptDrafts`: new title → `added`; same title and same body (trimmed) → `same`; same title and different body → `kept`, with the saved body untouched; result passes `validateStory`.
  - `upsertScript`: creates a new id; same title (case-insensitive) updates its body → `updated`; identical body → `unchanged`; the 201st new draft throws `Too many drafts`.
- [ ] **Step 2: Run** `node --test tests/world-zip-import.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** Title = file base name without extension, trimmed and cut to 200 chars. Draft ids from `newId()` (default `crypto.randomUUID()`), matched to `/^[a-zA-Z0-9_-]{1,80}$/`. Run the returned `story` through `validateStory(story, manifest)` before returning.
- [ ] **Step 4: Run.** Expected: pass.
- [ ] **Step 5: Commit** `feat(xce): safe world ZIP unpack and fill-only script drafts`.

### Task 3: `import_image_file` and `save_script`

**Files:**
- Modify: `lib/mcp/workspace.mjs` (add scopes, extract a shared `storeImage` from the `import_asset` branch, add two branches)
- Modify: `lib/mcp/data.mjs:74` (pass `fetchFile` in the deps object)
- Test: `tests/workspace.test.mjs` (extend the `fixture()`)

**Interfaces:**
- Consumes: `fetchFile` (Task 1), `upsertScript` (Task 2).
- Produces: `workspaceScopes.import_image_file='asset:write'`, `workspaceScopes.save_script='asset:write'`; `workspaceOperation(name, a, {auth, request, getImage, fetchFile})`. `storeImage(m, auth, request, getImage, {project_id, name, mime_type, bytes, upload_category}) -> {reference_id, asset_id, asset_code, sha256, status, reused:boolean}`, internal to `workspace.mjs` and reused by Task 4's image loop only through a category→`upload_category` map (see Task 4).
- Results: `import_image_file` → `{reference_id, asset_id, asset_code, sha256, status:'DRAFT'|'REFERENCE', approved:false, verified:true, reused}`. `save_script` → `{draft_id, title, kind, action}`.

- [ ] **Step 1: Write failing tests** (fixture gains `fetchFile: async (file) => image` by default):
  - `import_image_file stores a fetched image as a draft`: `{...edit, file:{download_url:'https://f.test/a', file_id:'file_1'}, name:'Kota face', upload_category:'cast:main'}` → `status:'DRAFT'`, `approved:false`, `verified:true`, one stored file, revision 2.
  - `import_image_file works without mime_type or file_name` (Review Focus 5): same result with only `download_url` and `file_id`.
  - `import_image_file rejects non-images`: `fetchFile` returns `Buffer.from('not png')` → rejects `/PNG, JPEG or WebP/`; no file stored.
  - `import_image_file reuses an identical image`: second call with the same bytes → `reused:true`, no second file, same `reference_id`.
  - `import_image_file needs asset:write and confirm`: added to the existing permission test list.
  - `save_script creates then updates by title`: first → `action:'created'`; second with a new body → `updated`, and the saved `m.story_workspace.document.documents` has 1 entry with the new body.
  - `save_script respects expected_revision`: a stale `expected_revision` rejects `/changed/`.
- [ ] **Step 2: Run** `node --test tests/workspace.test.mjs`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.**
  - Move the `import_asset` storage block into `storeImage` (keep `import_asset` behavior identical), and add the SHA-256 reuse check against `m.references`.
  - `import_image_file`: `bytes = await deps.fetchFile(a.file, {maxBytes: MAX_IMAGE_BYTES})`, then `mime = imageMime(bytes)` (sniffed, ignoring `a.file.mime_type`), then `storeImage`.
  - `save_script`: `m.story_workspace ||= {document: emptyStory(), revision: 0, updated_at: null}`, then `upsertScript` on `.document`. Bump `story_workspace.revision` and `updated_at` exactly as `app/api/story/route.ts` PUT does.
  - The `expected_revision` check uses the existing `check(revision===a.expected_revision, ...)` line, so make `expected_revision` required for both tools.
- [ ] **Step 4: Run** `node --test tests/workspace.test.mjs`. Expected: all pass, including the pre-existing `import_asset` tests.
- [ ] **Step 5: Commit** `feat(mcp): import_image_file and save_script tools`.

### Task 4: `import_world_zip`

**Files:**
- Modify: `lib/mcp/workspace.mjs` (new branch, handled **before** the generic `load(a.project_id)`, because `project_id` is optional)
- Test: `tests/workspace-world-zip.test.mjs`

**Interfaces:**
- Consumes: `fetchFile`/`ZIP_MAX_BYTES` (Task 1); `unzipPackage`, `scriptDrafts`, `mergeScriptDrafts` (Task 2); `storeImage` (Task 3); `readPackage`, `resolveWorld`, `applyRecords`, `attachImage`, `referenceIdFor` from `lib/xce/world-package.mjs`; the existing `create()` helper for new worlds.
- Inputs: `{file, project_id?, create_new?:boolean, new_name?:string(≤200), confirm:true}`.
- Produces the result: `{project_id, name, mode:'existing'|'created'|'ambiguous', candidates?:{id,title}[], revision, report:{created, updated, world_fields, kept, relationships}, images:{added, skipped_duplicate, skipped_locked, too_large, remaining}, scripts:{added, same, kept}, warnings, complete:boolean}`.

- [ ] **Step 1: Write failing tests** with an in-test `zipSync` fin package (`xce-world-package.json` naming 1 character with 1 image, plus `scripts/Ep1.md`):
  - `creates and populates a new world`: `mode:'created'`, the character exists as DRAFT, 1 image added, 1 script draft, `complete:true`, and the new project is added to `auth.projects`.
  - `second send changes nothing` (Review Focus 1): rerun → `created:[]`, `images.added:0`, `skipped_duplicate:1`, `scripts.same:['Ep1']`, and only one new revision at most.
  - `later ZIP fills only missing pieces`: a ZIP with a second character and a changed text field → the new character is created, and the changed field is listed in `report.kept` with the saved text unchanged.
  - `ambiguous world name writes nothing` (Review Focus 2): two granted projects titled like the ZIP's world → `mode:'ambiguous'` with 2 candidates; `calls` has no `save` and no `file_put`.
  - `locked asset images are skipped, others continue` (Review Focus 3): one asset LOCKED → `skipped_locked:[file]`, the other image added.
  - `too_large images are reported` (Review Focus 4): an image over 2 500 000 bytes → `too_large:[file]`, `complete:true`.
  - `time budget stops and resumes`: inject `now` advancing 50 000 ms after the first image → `remaining:1`, `complete:false`; rerun finishes it.
  - `refuses folder-locked and system-pool worlds` and `refuses non-ZIP bytes` (`/Not a ZIP/`).
- [ ] **Step 2: Run** `node --test tests/workspace-world-zip.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  1. Fetch with `ZIP_MAX_BYTES`, then `unzipPackage`, then `readPackage(files, a.file.file_name || 'world.zip')`.
  2. Build the project list from `request({op:'projects'})` filtered to `auth.projects`, then `resolveWorld(list, pkg, a.project_id||null, {createNew:a.create_new===true, name:a.new_name||''})`. Return early on `ambiguous`.
  3. On `create`: call the existing `create(fresh())` with `a.project_id` set to a new id (`'w-' + slug(name).slice(0,60) + '-' + randomUUID().slice(0,8)`) and `a.name` set to the resolved name, then reload.
  4. `applyRecords(m, pkg, {project_id, revision, choices:{}})`.
  5. Image loop in package order. Skip `too_large`. Skip a SHA-256 already in `m.references`. Store bytes via `request({op:'file_put', ...})` and read back with `getImage`, then `attachImage` inside try/catch (`Locked` → `skipped_locked`). Check the `now()` budget before each image.
  6. `mergeScriptDrafts` into `m.story_workspace.document`.
  7. Save once at the end (and every 10 images) through the existing `save`, carrying the revision forward.
- [ ] **Step 4: Run** `node --test tests/workspace-world-zip.test.mjs tests/workspace.test.mjs`. Expected: all pass.
- [ ] **Step 5: Commit** `feat(mcp): import_world_zip fills worlds incrementally from ChatGPT files`.

### Task 5: Register tools for ChatGPT, docs, full check

**Files:**
- Modify: `lib/mcp/server.mjs` (three `toolSpecs` entries; the `_meta` in the `registerTool` loop)
- Modify: `docs/UNIVERSAL_MCP.md` (one section on the three tools)
- Test: `tests/mcp.test.mjs`

**Interfaces:**
- Consumes: the tool names and inputs from Tasks 3 and 4.
- Produces: the zod `file = z.strictObject({download_url: z.string().url().max(4000), file_id: z.string().min(1).max(200), mime_type: z.string().max(100).optional(), file_name: z.string().max(300).optional()})`; `FILE_PARAM_TOOLS = new Set(['import_world_zip','import_image_file'])`, whose members get `_meta['openai/fileParams'] = ['file']`.

- [ ] **Step 1: Write failing tests:** after `tools/list` from `makeServer`, `import_world_zip` and `import_image_file` have `_meta['openai/fileParams']` deep-equal to `['file']` and an inputSchema `file.required` containing `download_url` and `file_id`; `save_script` has no file param; all three have `readOnlyHint:false`.
- [ ] **Step 2: Run** `node --test tests/mcp.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** Use these exact descriptions:
  - `import_world_zip`: "Import a world ZIP (World Builder fin ZIP, XSTUDIO export or folders) that the user attached. Fills only what the world is missing: new records, blank fields, images not already stored, and new script drafts. Never overwrites saved text, never approves or locks, never deletes. Safe to send again; it finishes anything left over."
  - `import_image_file`: "Import one attached PNG, JPEG or WebP image (up to 2.5 MB) into a folder as a draft or reference. No automatic approval. An image already in the folder is reused, not duplicated."
  - `save_script`: "Save a script, story or notes draft into a world's Story workspace. The same title updates that draft. Text only."
  - Raise the `readToolRequest` body allowance for `save_script` to fit 150 000 chars, in the same way `import_asset` is allowed a larger body in `request-body.mjs`.
- [ ] **Step 4: Run the full suite** `node --test tests/*.test.mjs`, then `npx eslint app components lib tests --max-warnings 0`, then `npx next build`. Expected: no new failures compared with branch base `152bb8d` (the 4 localhost-HTTP tests fail in the sandbox at base too), lint clean, build exits 0.
- [ ] **Step 5: Commit and push** `feat(mcp): register file pickup tools for ChatGPT` to `origin claude/mcp-file-pickup`.
