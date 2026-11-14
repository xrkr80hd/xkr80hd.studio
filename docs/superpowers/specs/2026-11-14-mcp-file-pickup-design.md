# XStudio MCP file pickup: worlds, images and scripts from ChatGPT

Date: 2026-11-14 · Branch: `claude/mcp-file-pickup` (from production `codex/xstudio-private` @ 152bb8d)

## Why

ChatGPT can reach XStudio over OAuth, but it cannot move files into it. MCP tool
arguments are text, so `import_asset` makes ChatGPT re-type an image as base64.
That is millions of characters for a character sheet, and it fails every time.
The owner wants to work from ChatGPT: send a World Builder ZIP and have the world
populate, send more ZIPs later to fill in what's missing, and save scripts into
the world as they're written. Manual uploading on the site should be the fallback,
not the only way.

## Goals

- ChatGPT can hand XStudio a **world ZIP**, and the server imports it with the
  existing world-package importer.
- **Incremental by design.** Any ZIP can arrive at any time. Each one fills only
  what is missing: blank text fields, new records, and images not already stored.
  Re-sending the same ZIP is safe and finishes anything a previous run left over.
- ChatGPT can hand XStudio a **single image** the same way.
- ChatGPT can **save a script** (text) into a world's Story workspace as a titled
  draft. Saving again with the same title updates that draft.
- Script or story text files inside a ZIP land in the Story workspace too.

## Non-goals

- A general file shelf for PDFs or Word files (option C). Not now.
- Overwriting saved text from ChatGPT. The web importer's per-field "use ZIP
  version" choice stays a website-only action.
- Changing locks, approvals or anchors. Imported records and images arrive as
  drafts and references.
- Deleting anything.

## Anti-goals (a failure even if it "works")

- A ZIP silently replaces text or images the owner already has.
- Duplicate characters or duplicate images after re-sending a ZIP.
- The server fetching arbitrary URLs that a prompt-injected model supplies
  (server-side request forgery).
- A locked world, a locked asset or a system pool being written to.

## Approaches considered

- **A. Three small tools (chosen).** `import_world_zip` and `import_image_file`
  take files through ChatGPT's file parameters. `save_script` takes plain text.
  This reuses the existing importer, storage and Story workspace, so it is the
  smallest build that covers everything asked for.
- B. ZIP only. Scripts would arrive only by re-exporting and re-importing a whole
  ZIP. Rejected as clunky for scripts that change often.
- C. A general per-world file shelf (PDF/DOCX). Rejected for now: it needs new
  storage, a viewer and UI, and it wasn't asked for.

## How file handoff works

ChatGPT's plugin SDK lets a tool mark a top-level input as a file with
`_meta["openai/fileParams"]: ["file"]`. ChatGPT then passes
`{ download_url, file_id, mime_type?, file_name? }` instead of the bytes, and
the XStudio server downloads the file itself. Per OpenAI's docs this applies to
files in the chat (attached, or picked from the ChatGPT file library). Whether
files surfaced by another connector qualify is **unverified**, and the first live
test will settle it.

The input schema follows the documented shape: an object with `download_url` and
`file_id` (both strings, required), plus optional `mime_type` and `file_name`.

### Safe download (shared by both file tools)

- Accept `https:` only. Resolve the host and refuse private, loopback,
  link-local and reserved addresses. Follow at most 3 redirects and re-check each
  hop. Time out at 20 s.
- Stream with a hard byte cap: images 2.5 MB (the existing site limit), ZIPs
  40 MB. Abort past the cap.
- Trust the bytes, not the label: images must sniff as PNG, JPEG or WebP
  (existing `imageMime`). ZIPs must start with `PK\x03\x04`.
- Never send XStudio credentials to the download host.
- Once the first live test shows ChatGPT's file host, add an allowlist for it
  (builder follow-up, noted in the plan).

## Tools

### `import_world_zip` (scope `asset:write`)

Inputs: `file` (file param); `project_id` (optional; otherwise the importer
resolves the world from the ZIP, as the site does); `create_new` (optional,
same meaning as the site); `new_name` (optional); `confirm: true`.

Steps:
1. Download (above). Unzip with `fflate`, capped at 400 entries and 120 MB
   uncompressed. Reject entries with absolute paths or `..` (zip-slip).
2. `readPackage(files, name)` → `resolveWorld` → refuse locked worlds and system
   pools. Ambiguous names return the candidate worlds and stop.
3. `applyRecords` with **no choices**, so every conflict keeps the saved value,
   then save with revision checks.
4. Attach images one at a time with the existing `attachImage` path: store,
   read back, verify SHA-256. Skip any image whose SHA-256 already exists in the
   world (true incremental fill). Stop cleanly when the time budget (about 45 s)
   is reached and report how many are left, so re-sending the same ZIP finishes
   the rest.
5. Script documents: `.md` and `.txt` files under a `scripts/` or `story/`
   folder, or with "script" in the name, become Story workspace drafts (kind
   `script`, or `story`/`notes` by folder). Title = file name without extension.
   If a draft with that title exists and the text is the same, skip it. If the
   text differs, keep the saved draft and report it (fill-only).
6. Return a report: world, created and updated records, fields filled, fields
   kept (conflicts), images added, skipped as duplicates and remaining, scripts
   added and kept, and warnings from the reader.

### `import_image_file` (scope `asset:write`)

Inputs: `file`, `project_id`, `name`, `upload_category` (same enum as
`import_asset`), `confirm: true`. This is the existing `import_asset` logic with
the bytes coming from the download instead of base64. It still arrives as a
draft or reference with no automatic approval. If the SHA-256 is already in the
world, it returns the existing reference instead of a duplicate.

### `save_script` (scope `asset:write`)

Inputs: `project_id`, `title` (max 200), `body` (max 150 000 chars), `kind`
(`script` | `story` | `notes`, default `script`), `expected_revision`
(optional), `confirm: true`. This is an explicit save, so the same title in the
same world updates that draft (unlike a ZIP, which only fills). It respects the
Story workspace limits (200 drafts, 1 MB total) through `validateStory`, and uses
the same revision check as the website so it never clobbers a concurrent edit.

## Constraints

- Reuse the existing modules: `world-package.mjs`, `world-package-read.mjs`,
  `story.mjs`, and the MCP storage path in `workspace.mjs` (`request({op:'file_put'})`).
  Base64 is used only server-side between XStudio and its own storage.
- Respect the MCP project grant (`includeCreatedProjects`) and folder locks
  exactly like the existing write tools.
- Vercel function limits: `maxDuration` 60 s. That's why images are time-boxed
  and resumable.
- Tool descriptions must tell ChatGPT these tools fill missing pieces only and
  never overwrite or approve.

## Testing

Unit tests with `node --test`, following `tests/*.test.mjs`:
- the download guard (https only, private IPs, redirect re-check, byte cap,
  magic bytes)
- zip-slip and entry or size caps
- an incremental fill run twice (second run adds nothing; images deduped)
- a conflict kept, not overwritten
- a locked world refused
- script drafts: added, same-skip, differing-kept; `save_script` update by title
- a partial image run resuming

Then a manual live test in ChatGPT after deploy: one image, then one small ZIP,
then the same ZIP again, then `save_script`.

## Left to the builder

- Exact report wording and the field names of the result JSON.
- Whether `import_world_zip` shares helper code with `app/api/world-import/route.ts`
  through a new `lib/xce/world-import-service.mjs` (preferred) or calls the
  library functions directly.
- The ChatGPT file-host allowlist, after the first live test.
