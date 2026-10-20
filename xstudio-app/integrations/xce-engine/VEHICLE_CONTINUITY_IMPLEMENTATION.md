# Universal vehicle and character continuity

Implemented in the existing XCE connector and the native XSTUDIO application. Both use the existing primary Supabase project manifests and private reference storage; no database migration or browser-local identity store is introduced.

## Commands

MVS means Make Vehicle Sheet. All four realistic/comic, simple/complex combinations are supported: mvsrlsmpl, mvsrlcmplx, mvscbsmpl, mvscbcmplx. Bare MVS defaults to realistic/simple. Example:

```
mvsrlsmpl - Toyota - Tundra - Platinum [actual 17-character VIN]
edit Change the seat upholstery to red leather.
```

The VIN is optional for custom vehicles. The make/model/trim labels are requests, never proof of factory specifications; project selection is independent. Existing project - vehicle name - VIN syntax and RVH/VH aliases remain. MCS remains Make Character Sheet with existing six-view layouts and RL/CB distinctions. Edit instructions accept a colon or whitespace, case-insensitively, including multiline instructions and multiple attributes.

## Behavior

- Nine vehicle views: seven exterior angles including exact overhead, plus front and rear cabin views through real openings. Optional third-row view; verified one-row cabins have an explicit unavailable rear slot.
- Locked baseline, separate approved modifications and active visual reference, stable asset IDs, original reference relationships and recoverable original records.
- NHTSA VIN validation/decoding with field-level provenance. Unavailable options/upholstery stay unverified; contradictory references must be resolved. Pano_Bot's inspected rules require exact reference fidelity but provide no existing VIN decoder implementation to reuse.
- Native character and vehicle creation/edit forms share continuity controls and saved schema. Pending requested changes must be resolved before generation. Original character face/body traits remain unchanged for wardrobe changes.
- Per-view preparation, inspection, explicit approval, isolated regeneration and history. Combined labeled SVG embeds actual saved images without distorting their geometry; output supports landscape, vertical and custom aspect ratios.
- Character sheet preparation, inspection and approval pins the real new sheet for subsequent scenes while retaining original identity/history.
- Scenes resolve current locked identity, approved changes and current actual reference images. Reference deletion/transfer protection covers continuity records and histories.
- Neutral reference backgrounds for compositing. No dealership scenery, headers or promotional branding is added.

## API and MCP

Native authenticated `/api/continuity` GET/POST and `/api/continuity/openapi` expose the same service used by native forms and MCP. Added MCP tools: `get_asset_identity`, `verify_vehicle_vin`, `manage_asset_identity`. Existing scoped API/OAuth authentication, project/folder access, production pause, explicit mutation confirmation and compare-and-swap revisions remain enforced.

Operations include read, command parsing, VIN decoding/verification, identity establishment, edits/resolution, evidence/discrepancies, per-view preparation/review/approval, character sheet preparation/review/approval, and combined-sheet export. Actual private reference bytes can be requested via include_media; IDs alone are not visual references. The connector routes continuity to the native primary service and does not create parallel identity records or fall back on failed writes. Existing legacy generation permits remain for legacy jobs.

## Validation

- Main application: 401 automated tests pass, TypeScript passes, changed components/service/API/MCP lint passes, default Next.js production build passes.
- Connector: 48 automated tests pass, TypeScript passes, Sites production build passes (existing route-classification advisory).
- Integration tests exercise real handler/service paths with fixture image bytes and simulated storage/VIN responses: two/three-row layouts, approved upholstery, character wardrobe/identity, reopening, revision conflicts, image approval, isolated regeneration/history, reload persistence, invalid/unavailable VIN data, API/MCP access and shared creation/edit data.

## Verification limits

No live vehicle images or videos were generated during implementation. Metadata and review gates detect reported inconsistencies but cannot prove pixel fidelity; actual images still require honest inspection. Browser UI testing was unavailable in this environment. Live VIN/build-sheet reconciliation and end-to-end production rendering remain unverified. Free-form edits retain exact authorization text and require explicit attribute resolution rather than claiming infallible semantic interpretation. Existing upload/storage limits remain in force.
