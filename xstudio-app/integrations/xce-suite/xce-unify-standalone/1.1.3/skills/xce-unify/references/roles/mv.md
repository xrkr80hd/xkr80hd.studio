# XCE_MV v2.0 — bundled UNIFY adaptation

## XCE CORE RULES v2.3 apply
The XCE CORE RULES v2.3 at the top of SKILL.md govern this file. Where this file disagrees with them (XSTUDIO anchor access, one frame per image, frame counts, numbering, naming, the per-frame review gate, invideo video, native audio only), the core rules win.


Read ../dse.md and ../production.md. Preserve original anchors, identity, proportions, wardrobe, props, geography, eyelines, screen direction and world-space light. Actual images must reach the renderer through supported inputs; prompt/seed/schema checks cannot guarantee likeness.

SL plans shots; AS advances narrative, SS freezes one instant. Default active UNIFY mode is seven AS shots with narrative functions defined in unify.md, not seven angles of a frozen beat. User-supplied shots/count/ending override defaults. FF = Final Frame (shot 7 by default); LF is its alias. FIRST_FRAME/LAST_FRAME exclusively name per-shot motion boundaries. CESRL+MV/CESCB+MV preserve RL/CB and explicit SS; +MVAS chooses AS. No mode shortcut alone renders.

In playground, recommend/revise one logical choice at a time when helpful. For a scoped GEN request, recap the actual selected scope when needed and render only that scope. GEN ALL is the full prepared production authorization: construct all seven shot records, final shot and missing boundary plans, then execute without shot-by-shot/final-frame reapproval. A material user change invalidates only dependent approvals. Do not restore the old mandatory 'Generate these now?' gate during GEN ALL.

Apply DSE as concrete lens/composition, motion, blocking and lighting choices while preserving separate CGE grade. Default clean premium naturalism. Seven separate full-bleed 16:9 frames, one per image tool call. No contact sheet, borders, bars, captions or added watermark. SHEET is one extra composed board, made only on the explicit SHEET command after every frame is APPROVED; it never replaces the frames. Four-angle coverage remains available only when explicitly selected: four views of one beat, not four advancing events. Request user choice of continuation angle when it affects further continuity; never turn it into the default GEN ALL route.

Carry every field in production.md for shots and video prompts. Do not invent cast to fill reverse close-ups. Use actual per-shot references and original anchors alongside generated frames. Preserve partial results, inspect available outputs and count exactly. External platform names are manual handoff targets, not connected services.

## CGE — retained grade module
On standalone cge reply exactly: Supply a pic or name a style. Preserve pending workflow; no image on that trigger. Analyze actual visible shadows/midtones/highlights, contrast, temperature/tint, saturation, grain and halation; distinguish estimates from measurements. Parse raw grade prompts without unsolicited images. Output grade JSON: grade_id (local), name, status:STAGED, prompt_token_string, parameters, and reusable grading prompt. No inferred Kelvin/stock/exact numeric controls from pixels.
A named-style request authorizes exactly one standalone 16:9 example, then concise explanation and: Confirm this grade to lock and parse, or describe adjustments. Preserve identity/clothing/world lights. Confirmation locks the look only in-session, JSON remains STAGED; no LUT/API/upload guarantee. A preselected grade in GEN ALL needs no extra preview. Keep existing grade until revised. DSE selection alone never launches CGE generation.
