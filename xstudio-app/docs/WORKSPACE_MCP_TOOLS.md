# XSTUDIO workspace MCP tools

The existing `/mcp` gateway now exposes read, organization, import and deletion operations. These work on XSTUDIO project folders, not native ChatGPT Projects or the local filesystem.

| Tool | Behavior | Scope |
| --- | --- | --- |
| create_folder | Create a new project ID/name and verify its saved revision | asset:write |
| update_folder | Rename/change description while preserving its ID | asset:write |
| import_asset | Import original PNG/JPEG/WebP bytes, up to 2.5 MB; verify stored hash; create a draft/reference in the chosen category | asset:write |
| import_project | Copy an authorized existing project into a new folder; reuse its private original-image associations | asset:write |
| delete_folder | Soft-delete a folder while retaining its records/images | asset:delete |
| restore_folder | Restore a folder previously in the grant | asset:write |
| delete_assets | Move exact selected asset IDs/codes into recoverable trash; dependency checks apply | asset:delete |
| restore_assets | Restore selected trash keys with original IDs and images | asset:write |
| list_trash | Read a folder's deleted status and selected/paged trash inventory | asset:read |
| purge_trash | Permanently remove selected trash records; retain shared stored image bytes | asset:delete |

Existing project/asset reads, canonical character image retrieval, metadata/classification edits and continuity tools remain available. All mutation tools require `confirm:true`. Updates/imports/deletes require the current `expected_revision`; a concurrent change rejects the operation. Locked/system folders cannot be modified. Project imports require a granted source and never overwrite an existing destination. Image import does not approve, lock or generate an image. `import_project` copies a project already saved in XSTUDIO; it does not restore an arbitrary external JSON/ZIP backup.

The server uses the existing owner-filtered Edge API, private image storage and revision-checked save operations. No database migration or public storage change is needed. New folders are tagged privately with a hash of the creating delegation's principal. Only that same delegation with write permission can automatically include those new folders; another connection's selected-project grant is not widened. Refresh retains the delegation identity; a separate reconnection can select the newly created folders normally.

New OAuth registrations advertise read, metadata, classification, write and delete permissions. The owner must approve the displayed scopes and selected projects. The consent screen explicitly names import/create/trash/permanent-purge capabilities. An old read-only grant does not gain permissions through refresh. If a client explicitly requests only `asset:read`, it remains read-only. Re-add/re-authorize the MCP connection with write/delete permissions to use the new tools. Existing client registrations can still explicitly request the new supported scopes during a fresh consent flow.

Large MCP requests remain capped at 64 KiB except `import_asset`, which has a 4 MB request cap and a 2.5 MB decoded image cap. All imports validate image signatures and read the stored bytes back before reporting success. A failure after file storage but before the revision-checked manifest save may leave an unassigned uploaded file; it never reports a successful import or overwrites a concurrent project update.

Verification: `node --test tests/workspace.test.mjs tests/mcp.test.mjs tests/oauth.test.mjs tests/character-reference.test.mjs`, then the normal production build. Live permission/asset mutation tests require an explicitly approved OAuth grant. Unit tests use isolated in-memory fixtures; they do not mutate live assets.
