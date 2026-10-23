# XSTUDIO Universal MCP gateway

## Current exact-image correction — 2026-10-21 (local, not deployed)

The older release/audit sections below are historical and are not proof of current deployment. Current source registers 24 tools, including `get_character_cref`. See [EXACT_REFERENCE_HANDOFF.md](EXACT_REFERENCE_HANDOFF.md) for the verified trace, patch, tests, live Gau retrieval, and remaining generation-client check.

Use `get_character_cref(project_id, asset_id=<exact code>, include_media=true)` for a saved character image. It defaults media on. `get_character_anchor` defaults media off; with media on it now shares CREF retrieval and returns actual MCP image blocks. Both fail on invalid locked source associations. Explicit `include_media=false` performs no image download. General asset/reference tools still return metadata and optional short-lived URLs, not pixel delivery.

The metadata text cap remains 1,500,000 bytes. The complete MCP tool-result envelope, including base64 images and duplicated structured metadata, is capped at 4,000,000 bytes. Originals above that response budget fail explicitly; they are never resized, reinterpreted or silently replaced. The shared private reader separately retains its 6 MiB original-file cap. Use a direct original attachment fallback for images exceeding the envelope budget.



Status: release authorized by Trav with “deploy all.” Deployment is based on commit `8345976d230871d9712480cd6d6b0d4cb163a21e`. Production state storage is activated on Fuchsia Lighthouse. Website release verification is recorded below.

Server URL after activation: **https://xstudio.xrkr80hd.studio/mcp**

XSTUDIO now includes its own OAuth authorization server using the existing verified owner login. No external OAuth provider is required. The implementation includes discovery, public-client registration, explicit project consent, PKCE S256 authorization codes, opaque access tokens, rotating refresh tokens, and immediate grant revocation. Native OAuth creates a separate read-only backend delegation on the server only after the owner approves consent; clients never receive that credential or the browser session.

Production uses the existing XSTUDIO/Supabase login and a dedicated server-only `XSTUDIO_MCP_STATE_TOKEN` credential. The new owner-scoped state Edge Function and RLS-protected table on Fuchsia Lighthouse provide durable OAuth state and atomic rate limits. No Redis account, external OAuth provider, signing key, or client-secret setup is required. The Redis adapter remains optional compatibility code.

## Audit evidence

- Vercel project: `xstudio-private`, project ID `prj_g9aItHvNkW8Ft0QcBDLepyv1TViM`, Next.js, Node 24. Production domain resolves to deployment `dpl_GjXGzJ5uPLhz9qFgaxbM6mArUHFQ`, source branch `codex/xstudio-private`, repository `xrkr80hd/xkr80hd.studio`.
- Supabase: `supabase-fuchsia-lighthouse`, `osbsjjoxepxezcmupcak`, ACTIVE_HEALTHY, PostgreSQL 17.
- Existing deployed `xstudio-assets-api`: version 6. Its engine endpoint authenticates hashed, expiring/revocable `xst_` credentials, checks `asset:read` and owner membership, and filters every engine table by owner ID. `verify_jwt=false` is intentional for its custom scoped-token validation, not evidence of anonymous asset access.
- Existing `lib/xce/xstudio-bridge.mjs` pins that exact backend URL. No new database or asset library was introduced.
- `xstudio_engine_projects`: owner + text project ID + revision + manifest. Real manifests contain references, scenes, native asset records, world-library records, character-network details/clauses, compositions, and custom color grades.
- `xstudio_engine_files`: owner + immutable object key + private storage location. `xstudio_assets` is a separate UUID upload/library index, not the complete canonical character/project model. The gateway retrieves canonical engine records; it does not pretend unassigned upload-index rows have project associations.
- Audit found 16 project rows and 503 engine file rows. 502 keys retain legacy owner path segments; some saved references intentionally retain source project segments after copying. Authorization therefore uses the exact association in the authorized saved manifest and the Edge API's real file-owner check, never a guessed owner/project prefix. Caller-supplied object keys are rejected by strict tool schemas.
- Both `xstudio-assets` and `xstudio-engine-files` buckets are private. All seven XSTUDIO tables have RLS enabled. Engine/token tables have no client RLS policies and are accessed through the authenticated owner-filtering Edge API.
- Security advisor: no XSTUDIO exposure warning. It reports INFO entries for RLS-enabled tables without policies (default deny) and one WARN for disabled leaked-password protection. Enable that protection separately if available for this Supabase plan: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . No security settings were changed.
- Uploaded PDF was reviewed as historical context. It references a legacy `chatgpt.site` address and does not establish the current backend or current database schema.

## Files

| Path | Purpose |
| --- | --- |
| `app/mcp/route.js` | Node.js remote MCP endpoint; delegates to authenticated gateway |
| `app/.well-known/oauth-protected-resource/route.js` | Root protected-resource metadata |
| `app/.well-known/oauth-protected-resource/mcp/route.js` | Resource-specific metadata referenced by challenges |
| `lib/mcp/server.mjs` | SDK transport, eleven strict tool schemas, size limits, authentication and audit wrapper |
| `lib/mcp/security.mjs` | OAuth JWT and API-grant validation, origin checks, shared Redis limiting |
| `lib/mcp/data.mjs` | Read-only adapter over existing authenticated Edge API; canonical saved records and media associations |
| `app/oauth/{authorize,token,register,revoke}/route.js` | Native OAuth endpoints |
| `app/.well-known/oauth-authorization-server/route.js` | Native authorization-server discovery |
| `lib/oauth/core.mjs` | Authorization-code/refresh lifecycle, secure state store, encrypted server delegation |
| `lib/oauth/http.mjs` | Existing-login integration, safe consent HTML, bounded OAuth HTTP endpoints |
| `lib/oauth/return-path.mjs` | Restricted login return path |
| `app/login/page.jsx`, `components/LoginForm.jsx` | Return to the pending OAuth consent screen after normal sign-in |
| `tests/oauth.test.mjs` | Complete native OAuth and consent/rotation/revocation tests |
| `tests/mcp.test.mjs` | Protocol, transport, authorization, identity, media and failure-path tests |
| `scripts/create-mcp-grant.mjs` | Local generation of a separate project-scoped client credential and its grant hash |
| `.env.example` | Configuration names, without secrets |
| `proxy.js` | Avoid browser-cookie refresh on MCP/metadata routes; gateway still authenticates |
| `package.json`, `pnpm-lock.yaml` | Exact SDK `1.32.1`, JOSE `6.2.12`, Zod `4.3.6` |
| `docs/UNIVERSAL_MCP.md` | Audit, architecture, activation, client setup and limitations |

## Transport and tools

Stateless Streamable HTTP uses JSON responses to POST. MCP SDK negotiates versions, capabilities, notifications, schemas, tool listing and calls. SDK current version is `2025-11-25`, with SDK-supported compatibility versions. GET and DELETE authenticate then return 405 because no standalone SSE stream or sessions are offered; this is allowed by Streamable HTTP. JSON-RPC batches are rejected. No generation, saving, code assignment, active-project changes, or mutation tools are registered.

| Tool | Required inputs | Optional inputs |
| --- | --- | --- |
| `list_projects` | None | `limit`, `offset` |
| `get_project` | `project_id` | None |
| `list_project_assets` | `project_id` | `category`, `limit`, `offset` |
| `get_asset` | `project_id`, `asset_id` | `include_media` |
| `get_character_anchor` | `project_id`, `asset_id` | `include_media` |
| `get_character_references` | `project_id`, `asset_id` | `include_media` |
| `list_establishing_shots` | `project_id` | `limit`, `offset` |
| `get_scene_references` | `project_id`, `scene_id` | `include_media` |
| `get_color_grades` | `project_id` | None |
| `get_composition_rules` | `project_id` | `character_ids` |
| `search_assets` | `project_id`, `query` | `category`, `limit`, `offset` |

IDs and saved codes both work for asset lookup. No IDs or codes are generated. Locked native character anchors use their exact pinned source image. World-library records and their saved face/body reference IDs are preserved. Drafts cannot satisfy `get_character_anchor`. Missing references are explicitly returned as missing; no replacement or automatic restoration occurs.

`include_media` defaults to false. True retrieves owner-authorized signed URLs from the existing backend with its existing 60-second lifetime. Private storage locations, folder PIN/session hashes, and raw saved URL values are withheld. A media URL is a short-lived capability required for retrieval; the server never embeds the MCP or backend credential in a URL. Diagnostic references are identified as not allowed generation inputs. Metadata retrieval does not claim that image pixels have been visually inspected.

`get_composition_rules` returns the saved configurations/network and uses existing shared character-context logic for `applicable` when selected character IDs are supplied. It never adds missing characters or invents Quick Details. `list_establishing_shots` requires an explicit saved establishing marker; scene/storyboard references without that marker remain accessible with `get_scene_references` and project asset listing. Folder-locked and deleted projects are unavailable to remote clients. No PIN bypass was added.

## Authentication and isolation

Native OAuth is the default:

1. A client discovers `/.well-known/oauth-authorization-server` from the protected-resource metadata. It dynamically registers at `/oauth/register` using public-client authentication (`none`). No client secret is required. Only authorization-code/refresh-token grants and `asset:read` are supported.
2. The client sends the user to `/oauth/authorize` with its exact registered redirect, `resource=https://xstudio.xrkr80hd.studio/mcp`, PKCE S256 challenge and state. The existing XSTUDIO login verifies the sole owner through Supabase Auth and `xstudio_owners`; no user-editable metadata grants access. A restricted local return path restores consent after sign-in.
3. The consent screen displays the registered client name and full callback, and lists actual unlocked/undeleted owner projects. No projects are checked automatically. The owner explicitly selects projects and approves, or cancels. Dynamic registration alone never authorizes assets. Consent has a secure HttpOnly browser cookie, a matching CSRF token, same-origin POST validation, a ten-minute lifetime, clickjacking/CSP protection and escaped text.
4. Approval creates an independent backend credential using the existing authenticated owner token endpoint, with ONLY `asset:read` and a 31-day expiry. This is a normal consent-time credential write after deployment, not an asset/project mutation. Its plaintext stays on the server. AES-256-GCM encrypts it in the private state store using a purpose-derived key from the server Redis credential. The existing browser session JWT is never persisted or forwarded to an external client. Rotation of the Redis credential invalidates these encrypted delegations and requires reconnecting.
5. The authorization code is 256 random bits, stored by hash, usable once, valid sixty seconds, and bound to client, redirect, owner, resource and PKCE challenge. The callback returns `iss` and the exact client state. Invalid redirects are rejected locally, never used for an error redirect. Access/refresh tokens never appear in URLs; the one-time authorization code necessarily uses the standard OAuth callback query.
6. `/oauth/token` exchanges the code plus verifier for a 15-minute opaque `xmo_` access token and a rotating `xmr_` refresh token. Each token is stored only by hash. A grant is limited to the exact consented project IDs and expires after thirty days. Every asset request verifies the live grant and existing backend credential. No identity-provider signing key/JWKS is needed for native tokens.
7. Refresh rotation uses an atomic Redis compare/delete/tombstone script. Reuse revokes the whole token family, including later access tokens. `/oauth/revoke` immediately removes the family; access and refresh tokens then fail. An unrelated client cannot revoke it. The private delegation ciphertext disappears with the grant; the upstream read-only credential remains revocable in the existing XSTUDIO Connections credential list and otherwise expires automatically.

Optional compatibility modes remain available:

- Static `xmc_` API credentials with SHA-256 server-only grants, explicit project IDs and expiry. Unlike owner-wide `xst_` API keys, they cannot bypass MCP by calling the Edge API directly. These optional static clients require `XSTUDIO_MCP_UPSTREAM_TOKEN`.
- An explicitly configured external RFC 9068 JWT issuer remains supported with issuer/audience/signature/scope/client/subject checks and an explicit static project grant. Leave the issuer/JWKS settings blank to use native OAuth. An external provider is no longer a prerequisite.

All tool operations are limited to the existing `projects`, `load` and `file_get` read operations. The project gate runs before lookup. Media signing uses exact authorized saved manifest associations plus the Edge API's actual owner filter, preserving migrated/copied paths. The server does not create replacement asset IDs or duplicate storage. Folder-locked/deleted projects are not available remotely. This implementation is for the existing single verified owner.

Limits remain: 64 KiB MCP request, 16 KiB OAuth request, 1.5 MB tool result, sixty references, one hundred records/page, bounded upstream reads, timeouts and no redirected backend fetches. The existing project inventory operation caps at 1,000 rows; an oversized response fails closed. Shared Redis fixed windows provide 600 MCP requests/minute globally and sixty/minute per grant/client principal. OAuth registration is limited to twenty/minute globally, token/revocation/authorization endpoints to 120/minute each. State keys have expiry and atomic single-use semantics; no in-memory production fallback is used.

Audit events omit all credentials, callback codes, payloads, signed media URLs and exception stacks. Configure platform/proxy log redaction so OAuth callback/authorize query strings and cookies are not recorded, and never log OAuth token request/response bodies. Responses are no-store. Use the existing hosting log retention policy. Redis must be private, TLS-protected and persistent; loss of state safely disconnects clients. The application code does not log OAuth query strings or secrets. Configuring hosting log policy remains part of deployment.

## Configuration and activation (not executed)

1. Review the local diff and current production branch; retain intervening work. Existing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `XSTUDIO_OWNER_USER_ID` already support normal owner login. This implementation does not replace that login or change its password handling.
2. Configure one private persistent Redis REST endpoint supporting `GET`, `SET EX NX`, `GETDEL`, `DEL`, `EXISTS` and atomic `EVAL` command arrays. Set server-only `XSTUDIO_MCP_REDIS_URL` and a strong private `XSTUDIO_MCP_REDIS_TOKEN` of at least 32 characters in the intended Vercel environment. This one store handles both OAuth and rate limits. The Vercel account integration inventory was checked: Supabase and VS Code are connected; no Redis integration was listed. No Redis service was created or charged during local work. These two deployment secrets are still required.
3. For native OAuth, leave `XSTUDIO_MCP_OAUTH_ISSUER`, `XSTUDIO_MCP_OAUTH_JWKS`, `XSTUDIO_MCP_UPSTREAM_TOKEN` blank and `XSTUDIO_MCP_GRANTS=[]`. No manual OAuth provider/client registration or backend API token is needed. Native consent creates the read-only delegation on demand through the existing v6 API. Static API/external-JWT clients are optional and use the separately documented settings.
4. Keep `XSTUDIO_MCP_ORIGINS=https://xstudio.xrkr80hd.studio` unless a specific trusted browser origin is needed. Server-to-server clients normally send no Origin. Configure secret and log retention/redaction policies; do not expose any private values as `NEXT_PUBLIC_` variables.
5. After explicit **push**, deploy the reviewed branch through the existing `xstudio-private` Vercel project. No Supabase migration, table creation, or Edge-function redeployment is required. Normal runtime consent creates auth credentials using the already deployed API, without changing any assets.
6. Verify `https://xstudio.xrkr80hd.studio/.well-known/oauth-authorization-server` advertises native `/oauth/authorize`, `/oauth/token`, `/oauth/register`, `/oauth/revoke` and S256. Verify the MCP protected-resource metadata names the XSTUDIO issuer. An unauthenticated MCP request should return 401 plus the discovery challenge once infrastructure is configured.
7. Connect one hosted client, sign in to existing XSTUDIO, explicitly approve a project, verify tool discovery, retrieve a real saved reference, attempt an excluded project, refresh, revoke and confirm denial. Check ordinary login/project/composer/asset preview behavior. The existing Connections page shows the generated credential with an `MCP OAuth:` label and read scope. Hosted-client tests are still pending deployment.

Before any deployment or repository push, ask: **Is there anything else that needs to be done?** Wait for Trav's explicit **push**. Nothing has been committed, pushed, deployed, or changed in production.

## Client setup after activation

**Grok Custom Connector**: open https://grok.com/connectors, New Connector → Custom, name `XSTUDIO`, URL `https://xstudio.xrkr80hd.studio/mcp`, then connect using OAuth. The native discovery/registration flow supplies the client registration. Sign in with the existing XSTUDIO owner account and select projects on the consent page. No separate OAuth-provider account is needed. Business/Enterprise may require administrator provisioning. If a client UI requires manual client registration, use the native DCR endpoint and its exact callback; do not enter a token in the URL. Actual Grok client interoperability remains unverified until deployment.

**ChatGPT**: where custom MCP connections/developer mode are available, add the same URL and choose OAuth. Native discovery advertises DCR rather than CIMD; ChatGPT's DCR path can register its actual callback with `/oauth/register`. Sign in to XSTUDIO and approve selected projects. Public clients use PKCE without a client secret. Actual account availability and hosted callback behavior remain unverified.

**Codex**: native OAuth setup follows its MCP OAuth flow:

```sh
codex mcp add xstudio --url https://xstudio.xrkr80hd.studio/mcp
codex mcp login xstudio
```

The CLI's loopback callback must use an HTTP loopback IP literal such as `127.0.0.1` or `[::1]`. Hostname `localhost` is intentionally rejected for callback security. No Codex binary was available here; its actual CLI registration/consent flow remains untested. For optional static API-token mode, use:

```toml
[mcp_servers.xstudio]
url = "https://xstudio.xrkr80hd.studio/mcp"
bearer_token_env_var = "XSTUDIO_MCP_CLIENT_TOKEN"
```

Generate a separate `xmc_` credential in a private local terminal with `node scripts/create-mcp-grant.mjs ACTUAL_PROJECT_ID`; configure only its hashed grant plus a server-only read credential. This mode is optional; native OAuth has no manual token-copy step.

**Other clients**: choose Streamable HTTP, the same server URL, and native OAuth authorization-code + PKCE S256 with DCR. Clients must send the exact MCP resource in authorization/token requests. JSON responses, initialized notifications and GET 405/no sessions follow the existing transport design. Actual image inspection requires fetching the returned short-lived signed media URLs; metadata alone is not visual inspection.

## Verification and remaining work

- Native OAuth tests cover registration/discovery, redirect checks, CSRF/cookie protection, explicit project consent, scope/resource binding, single-use/concurrent code redemption, PKCE, expiry, rotation/replay detection, revocation, encryption and read-only delegation creation.
- A complete integration test runs real localhost HTTP requests through discovery → registration → consent HTML/form → code exchange → independent MCP SDK tool discovery/execution → refresh → revocation → denied MCP request. Owner login and project data use isolated fixtures; no production credentials or assets are substituted.
- Final checks: **255/255 tests pass**, comprising **42 native OAuth tests**, **49 gateway tests**, and **164 existing regression tests**. Lint, TypeScript, production build, and whitespace checks pass. Existing tests cover project authorization, saved identity/reference behavior, optional JWT authentication, and previous application functions.
- The native sign-in uses the existing verified `requireOwner()` path. Real Supabase sign-in, consent-time credential issuance, Redis provider behavior and hosted Grok/ChatGPT/Codex checks still require an activated deployment. Local encryption, state-adapter commands, token issuance shape and HTTP behavior are tested; no hosted certification is claimed.
- No production OAuth grant, client, token, credential, storage file or project was created/modified in this turn. The remaining activation prerequisites are Redis deployment credentials, the explicit push command, and hosted smoke testing. There is no longer an unimplemented external OAuth-provider dependency.

## Official references consulted

- MCP transport: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- MCP authorization: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- ChatGPT OAuth resource-server/authorization-server roles and PKCE: https://developers.openai.com/plugins/build/auth
- Codex remote MCP and bearer-token environment configuration: https://learn.chatgpt.com/docs/extend/mcp?surface=cli
- Grok custom connectors: https://docs.x.ai/grok/connectors
- Supabase private storage signing: https://supabase.com/docs/guides/storage/serving/downloads

The Supabase changelog markdown fetch was unavailable in the browsing tool. No Supabase API/schema feature was added; this implementation reuses the inspected deployed v6 API.

## Production release update

- Added `public.xstudio_oauth_state` and service-role-only `xstudio_oauth_state_op` with security-invoker execution, owner isolation, expiration cleanup, atomic consume/refresh rotation and fixed-window rate counters. Anonymous/authenticated client roles have no table privileges and no function execute privilege.
- Deployed the independently authenticated `xstudio-oauth-state` Edge Function v1; existing `xstudio-assets-api` v6 is unchanged. Its credential requires the dedicated `mcp-state` provider, hashed token verification, owner membership, read scope, expiration and revocation checks.
- Configured the dedicated secret as sensitive production Vercel environment data. It is not in source control or browser code. Its planned expiry is October 18, 2027; rotate before then. Delegation encryption uses this private credential with a purpose-specific derived encryption key.
- Live checks passed: state put/read, atomic rotation, replay-marker retrieval, removal, shared rate limiting and anonymous 401. SQL privilege checks confirm anonymous roles cannot read or execute the state API. Security advisors report no new exposed-data warning; the existing leaked-password-protection warning remains.
- The earlier Redis activation instructions describe the optional adapter, not the deployed path. Redis is NOT required for this release.
