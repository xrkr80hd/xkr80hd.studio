# Source audit and compatibility

## XCE CORE RULES v2.1 apply
The XCE CORE RULES v2.1 at the top of SKILL.md govern this file. Where this file disagrees with them (XSTUDIO anchor access, one frame per image, frame counts, numbering, naming, the per-frame review gate, invideo video, native audio only), the core rules win.


Audited source: xce-unify-standalone, backend ID plugins_6ada730bcde481918abb3555932e3381, USER/PRIVATE; release pluginrel_6aded5041e488191a872e79bacf65b63. Package 1.0.3, interface XCE_UNIFY v1.0.1, skill/coordinator/handoff still 1.0.0. No MCP config, app binding, endpoint, executable command handlers or production database in full 11-file inventory. assets/unify.png is retained unchanged by overlay; no binary edit needed.

Staged contract target: XCE_UNIFY v1.0.1. Package version 1.0.4 is required to remain greater than installed 1.0.3; this is packaging version, not a downgrade to 1.0.1. Both manifests stay synchronized. Preserve package identity, author, presentation, defaultPrompt text/type, sharing and icon.

Available contracts read: bundled IGNITION 1.0.1 (six-slot sheet and nine vehicle views); installed SCRIBE 1.0.2; installed MV 2.0 plus DSE; installed FIRESTARTER 1.0.0 (requested 1.0.1 not available in the inspected installed contract). Preserve the actual FIRESTARTER version rather than inventing it. SCRIBE's stale MV v1.0.1 handoff and four-angle text are reconciled in this plugin's bundled adaptation; separate specialist plugins are not modified.

Changes replace the coordinator and shared protocol, update MV/SCRIBE orchestration, integrate DSE, add production schemas and acceptance scenarios. Retain IGNITION exact-reference rules, source identity, six-slot QA, vehicle commands, FIRESTARTER canon ledger/six-tag US/STF, SCRIPT alias, SS context distinction, FF/LF final semantics, CGE, sheet modes, education preferences and partial-output handling.

Conflicts removed: default four-angle loop; default six/twelve-shot commercial count; camera-angle template used as narrative progression; repeated final-frame/per-shot render gates under GEN ALL; stale role versions; no-location-research blanket restriction; obsolete exact runtime/count conflict questions when seven-shot timing can fit. Seven AS shots and complete-scope authorization now own the default. Explicit legacy choices remain supported.

Capabilities: instruction-based same-conversation coordination, host image calls when available, actual-reference mapping, planning/review, text handoffs, checkpoints and supported file exports. No executable router existed to patch; command recognition remains host interpretation. Reference schemas are records, not remote endpoints. Cannot guarantee tool quota, perfect likeness/geometry/text, access to unseen photos, cross-chat durable memory, exhaustive visual correctness or external provider compatibility without evidence. No external video invocation or credits are authorized.

Plugin-system update authorized directly by the user. This update needs no Site, Git commit/push, deployment, Supabase write or backend connection. Acceptance tests are contract/model checks, not proof of live image generation. The plugin-system save result and read-back verification determine installed release status.
