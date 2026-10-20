# Universal vehicle and character continuity

ONE ASSET. ONE IDENTITY. MULTIPLE CAMERA ANGLES. ZERO UNAUTHORIZED CHANGES.

Use https://xstudio.xrkr80hd.studio and its configured Supabase primary backend. Audit live composer schema, connector endpoints and XSTUDIO_PRIMARY before initial production. Stop if the primary route is disconnected or mismatched. Legacy MCP hosting may remain at the ChatGPT Site; do not confuse that hosting URL with the primary data destination.

## Parse and resolve
MVS means Make Vehicle Sheet; MCS means Make Character Sheet. Parse vehicles with `mvsrlsmpl - [make] - [model] - [trim] [optional VIN]`, followed by `edit [instructions]` on the next line. Accept `edit:` too, case-insensitively. Support MVS, MVSRLSMPL, MVSRLCMPLX, MVSCBSMPL, and MVSCBCMPLX. The descriptor is a requested label, not authenticated factory evidence. Resolve the project independently from the selected project or explicit storage request; make is never a project name in this format. Retain project - vehicle name - VIN and existing RVH/VH aliases. Character commands remain MCSRL/CB SMPL/CMPLX with project - character name. Preserve commas, newlines and hyphens inside edits. Never print edit instructions, VINs or internal metadata into artwork.

Resolve the exact named project and existing asset first. For a subsequent edit, use its saved identity and current revision; do not intake an unrelated replacement asset. For a new saved asset, use the existing intake or creation workflow and inspected original references. Missing named projects must be resolved explicitly; do not silently bind an identity to Lost Assets. Keep post-generation Lost Assets fallback for otherwise authorized standalone outputs.

## Vehicle baseline and edits
Use verify_vehicle_vin for complete 17-character VIN validation and legitimate NHTSA vPIC decoding. Decode only fields actually returned successfully. Upholstery, exact installed trim/packages, paint, wheels and options are not proven by a VIN alone. Use authenticated build data or inspected assigned reference images via manage_asset_identity action=evidence. Record source IDs and provenance. Missing facts stay unverified. Invalid, mismatched or unavailable VIN data cannot become a verified factory baseline.

Use manage_asset_identity action=read/establish/verify_vin/edit/resolve_edit/evidence/resolve_discrepancy with the current expected_revision. Keep base_identity, approved_modifications and active_visual_reference separate. Preserve earlier approved edits. An edit is explicit customization authority, not authority to change unrelated attributes; resolve only the requested fields. A verification-only instruction must use intent=verify and must not invent a customization. Flag contradictory VIN/reference evidence and resolve it explicitly before production. Locked originals remain unchanged; edits create recoverable draft versions sharing the same root identity.

## Nine camera views
Generate these as individually reusable images of the same vehicle:
1. FRONT: centered symmetrical front elevation.
2. FRONT 3/4: driver-side front three-quarter.
3. PROFILE 1: perpendicular full driver-side profile.
4. REAR: centered rear elevation.
5. REAR 3/4: passenger-side rear three-quarter.
6. PROFILE 2: perpendicular full passenger-side profile.
7. TOP-DOWN: true 90-degree overhead of the entire vehicle.
8. FRONT CABIN: actual driver-side opening horizontally across the front cabin toward the passenger side.
9. REAR CABIN: actual passenger-side rear access horizontally across rear seating toward the driver side. Respect real door configurations; do not invent rear doors or seats.
Offer a supplementary third-row image only when three rows are established. A confirmed one-row vehicle uses mark_view_not_applicable for the rear-cabin slot, with evidence notes; never fabricate a cabin.

Use neutral, consistent reference lighting and backgrounds for compositing. Do not add dealership locations, headers, promotional branding or scenery. Preserve genuine factory badges and intentional customizations. Maintain precise geometry, wheelbase, paint, wheels, lights, grille, trim, cabin layout, steering position, seat count, upholstery, stitching and equipment. Aspect ratio may be 16:9, 9:16 or another valid configured ratio; framing does not change asset identity.

Prepare each camera with manage_asset_identity action=prepare_view using the exact native saved asset ID and current revision. Retrieve get_asset_identity include_media=true to receive actual assigned image bytes; IDs alone are not visible references. Render the returned exact camera prompt through the available host image tool using those actual images. Save the real output through the existing primary upload workflow, then register it with manage_asset_identity action=record_view, the current expected_identity_revision, inspection notes and all nine checks. Native World Library assets use this native continuity workflow; do not duplicate them in legacy manifest_store or require legacy-only permits. Existing legacy engine jobs retain their guardrail_preflight/claim_generation/record_generation controls. The connector prepares and stores; it does not render images itself. Inspect body configuration, paint, wheels/tires, grille/lights, trim/badges, interior layout, seats/upholstery, modifications and camera angle. Structural validation cannot prove pixel fidelity.

A failed view is flagged separately. Regenerate only that angle; preserve other approved views and prior output history. Approval requires explicit user review of that exact image through action=record_view. Use action=finish_sheet to combine the current nine approved slots into a labeled embedded-image SVG; keep all original angle images individually accessible. Optional third-row output stays separately reusable.

## Characters
Preserve the existing six-view character layouts and RL/CB modes. For native saved characters use the same manage_asset_identity edit/resolve_edit workflow, then prepare_sheet with the requested mode/medium. Retrieve actual images with get_asset_identity include_media=true, render through the host, save the real output, record_sheet with face_identity/anatomy/wardrobe/format checks and inspection notes, then approve_sheet only after explicit review of that exact sheet. Approval pins the new image for subsequent scenes while preserving the original identity and history. Existing legacy character records retain prepare_wardrobe_edit. All four MCS commands keep project - name - edit syntax. Freeze face, age, complexion, body proportions, recognizable anatomy and hair unless the user separately explicitly authorizes the corresponding appearance edit. Wardrobe instructions never implicitly authorize identity or body-size changes. Keep creation and editing on the same visual_identity schema. Maintain prior approved outfit changes and exact original references across subsequent edits.

## Storage, scenes and interfaces
Use persistent project/asset IDs, original reference relations and Supabase-backed manifests. Reference views, histories, evidence and combined sheets remain linked to the root identity. Asset name changes do not replace IDs. Browser-local preferences are never the identity source of truth. Saved scene compilation includes the active identity/modifications and current approved vehicle views; reject unresolved edits, VIN failures and discrepancies before production.

Expose the shared handlers through authenticated /api/continuity and MCP get_asset_identity/verify_vehicle_vin/manage_asset_identity; read /api/continuity?action=schema for the same schemas. API GET reads by project_id/asset_id/asset_type. POST writes require existing owner authentication, folder access and expected_revision. Use the existing MCP OAuth gateway and do not expose secrets or grant public write access. Keep existing preflight/claim/record tools for legacy jobs; native continuity operations share the primary native API and MCP service. These source changes require a later authorized release; a local edit does not make new tools live.

Honor STBY, ANSR, RPTPLS and LTSTLK. Never render quoted examples or an instruction-editing request. Do not commit, push or deploy without the user's explicit push authorization.
