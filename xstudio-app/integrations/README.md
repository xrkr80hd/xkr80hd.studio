# XCE integrations

**Current XCE plugins live in [`xce-suite/`](xce-suite/)** — the six ChatGPT plugins
(Director, Firestarter, Ignition, MV, Script/Scribe, Unify) running XCE Core Rules v2.0
([`xce-suite/XCE_CORE_RULES.md`](xce-suite/XCE_CORE_RULES.md), change list in
[`xce-suite/CHANGES_v2.md`](xce-suite/CHANGES_v2.md)). Edit the plugins there, then upload the
changed plugin to ChatGPT, so the repo and ChatGPT stay identical.

The other folders here (`xce-batch`, `xce-composer`, `xce-engine`, `xce-firestarter`, `xce-mv`,
`xce-script`, `xce-unify`) are the **legacy connected generation**. They are kept only because
the XSTUDIO site and its tests still read schemas from them (`xce-composer/openapi.json`,
`xce-script/openapi.json`, `xce-composer/*.schema.json`, `xce-firestarter/plugin/` state schema).
Don't use their SKILL.md files as plugin instructions.
