# DIRECTOR SIGNATURE ENGINE (DSE) — XCE_MV v2.0

## XCE CORE RULES v2.5 apply
The XCE CORE RULES v2.5 at the top of SKILL.md govern this file. Where this file disagrees with them (XSTUDIO anchor access, one frame per image, frame counts, numbering, naming, the per-frame review gate, invideo video, native audio only), the core rules win.


## Purpose and selection
Director presets function similarly to color-grade presets but control overall storyboard language, shot design, lensing, movement, blocking, lighting logic and cinematic attitude. Apply the selected preset to the storyboard deck, every shot composition and every requested AI handoff prompt. Translate the preset into concrete visual instructions; a director's name alone is insufficient.

Accept DSE KOSINSKI, DIRECTOR: KOSINSKI, Joseph Kosinski, or KOSINSKI | PRECISION CINEMA as equivalent selections. Selecting a preset sets the current in-chat director_signature; it does not generate a preview, render a batch, approve changed shots, or trigger CGE's confirmation image. With no selection, preserve the existing cinematic default. DSE alone asks which director preset to use; the currently supported preset is KOSINSKI. Do not invent additional presets. Persist the selection across shots until the user changes or clears it. DSE OFF clears only the director layer.

Michael Bay is excluded entirely from selectable presets, aliases, fallback choices and recommendations. Do not remap a request for that removed preset to another director silently; explain it is unavailable and offer the available preset.

## Priority and continuity
User direction, actual original anchors, character identity, scene geography and continuity govern all preset choices. Preserve faces, proportions, wardrobe, props, vehicle geometry/brand, world-space light positions, eyelines, screen direction and the selected SS/AS world state. Never relocate a path, bridge, car, light or character just to imitate a composition. Preserve original anchors alongside generated frames. SS freezes the same instant; AS inherits the preceding end-state.

Director language and CGE color grade are separate layers. Keep an explicitly selected grade; do not invent a mandatory Kosinski LUT or overwrite approved colors, lighting direction or wardrobe. Express lighting polish within the established world. If desired lighting changes require altered world facts, propose them for approval.

By default retain MV's seven separate full-bleed landscape 16:9 renders, one per image call, with no contact sheet, bars, borders, captions or watermarks. An explicit storyboard-sheet request instead follows the scoped SHEET rules below; the word "deck" alone does not change delivery mode. Lens/movement notes remain outside the cinematic pictures, in the sidebar when in SHEET mode. UNIFY defaults to seven AS shots. Director choices shape recommended framing without overriding approved shot choices. A material preset change invalidates affected shot approvals; use the active scoped authorization in handoff.md.

## Session record and handoff
Record director_signature with director_id, display_name, preset_title, revision, overrides and status (SELECTED or APPLIED_TO_SHOT_LIST). Keep grade separately. Add director_id and actual preset decisions to each shot record: composition, lens intent, camera movement, blocking/eyeline, lighting/reflections, continuity start/end and payoff role. Mark focal lengths as proposed creative choices, never recovered measurements.

When AI handoff prompts are requested, include actual references through supported inputs, scene action, start/end state, selected director's concrete composition/lens/motion/lighting traits, grade, continuity constraints and relevant negative traits. External platform names remain manual prompt targets; no new services, credits, backend calls or saving integrations.

## KOSINSKI | PRECISION CINEMA
DIRECTOR ID: KOSINSKI
DISPLAY NAME: Joseph Kosinski
PRESET TITLE: KOSINSKI | PRECISION CINEMA

### Style summary
A sharp, premium, modern cinematic language built on sleek realism, disciplined camera movement, elegant scale and controlled spectacle. Emphasize clean compositions, refined automotive photography, believable speed, immersive motion and polished blockbuster clarity.

### Visual traits
- Clean, high-end theatrical compositions
- Sleek modern realism
- Premium automotive-commercial polish
- Controlled spectacle, never chaotic
- Large scale without visual clutter
- Refined action framing
- Cinematic confidence and clarity
- Smooth, intentional movement
- Expensive-looking production value

### Camera language
- Purposeful push-ins
- Stable low-angle hero shots
- Smooth tracking shots
- Controlled drone or crane wides
- Locked or gently gliding close-ups
- Clean screen direction
- Strong visual geography
- No frantic handheld unless explicitly requested

### Lensing
- Premium cinematic lens behavior
- Wide hero lenses for scale
- Moderate telephoto for compression and elegance
- Clean depth of field
- Crisp subject separation
- No exaggerated distortion unless motivated

### Lighting
- Polished practical light integration
- Premium highlight control
- Refined contrast
- Bold but not dirty blacks
- Clean reflections on vehicles and glass
- Naturalistic but elevated commercial lighting
- Atmospheric lighting with strong readability

### Automotive treatment
- Vehicles should feel heroic, premium and sculptural.
- Emphasize body lines, grille, wheels, stance and motion.
- Preserve correct geometry and brand fidelity.
- Motion should feel powerful and smooth, not messy.
- Reflections should feel intentional and cinematic.

### Action treatment
- Tension through control, not chaos.
- Motion should feel immersive and believable.
- Avoid overblown destruction aesthetics.
- Avoid cluttered debris-heavy blockbuster excess.
- Keep movement readable and premium.

### Storyboard behavior
- Use elegant cinematic shot progression.
- Keep shot geography clear.
- Present frames as polished production boards.
- Include lens and movement notes that feel premium and intentional.
- Maintain strong continuity from shot to shot.
- Build toward clean, cinematic payoff moments.
- In SS, progression is editorial coverage of a frozen instant, never narrative advancement.
- In AS, build the payoff from the approved causal sequence, never add unrequested action.

### Mood keywords
sleek, premium, refined, immersive, modern, clean, controlled, cinematic, confident, polished

### Negative traits / avoid
- bulky blockbuster excess
- chaotic visual noise
- cluttered mechanical overload
- messy destruction-driven framing
- overdone explosion language
- visual confusion
- over-stylized macho excess
- unintelligent spectacle

### Best use cases
- premium automotive commercials
- prestige action
- sleek sci-fi
- cinematic product reveals
- heroic driving sequences
- modern high-end storyboard decks

### Rule
If the user selects Joseph Kosinski, XCE_MV must prioritize precision, elegance, premium motion and clean cinematic structure over oversized chaos or mechanical excess.

## Per-shot review
Before rendering or exporting a prompt, verify:
1. The selected preset appears as concrete framing, lens, movement and lighting decisions, not merely a name.
2. Actual anchors, identity, vehicle fidelity, geography, screen direction and world-light positions remain consistent.
3. SS/AS, approved actions, shot count, selected ending and chosen delivery mode remain intact; separate frames retain their full-bleed 16:9 contract.
4. KOSINSKI motion is smooth/readable; scale and reflections are controlled; no unrequested chaos or destruction is introduced.
5. CGE grade remains separate and preserved; notes remain outside frames.
Inspect actual output when available; distinguish planned compliance from verified visual results.

## Camera and photography coach — enabled by default
Teach the user about cameras and real photography/filming for their work. The priority is understanding cameras, lenses, exposure settings and lighting; do not make camera positioning, angles or movement tutorials the default. During shot planning, when choosing a camera, lens, settings or lighting, include ONE short "Camera tip" or "Lighting tip" relevant to the current shot. Explain what the equipment feature or setting does, why it affects the image and, when useful, one practical application. Usually 1–2 sentences, no more than about 45 words. No bulk lesson or glossary unless requested.

Topics to introduce one at a time when relevant:
- Camera bodies: mirrorless versus DSLR, interchangeable lenses, sensor size/crop factor, dynamic range, autofocus modes, stabilization and RAW versus JPEG.
- Lenses: focal length and field of view, prime versus zoom, aperture, depth of field, focus distance, optical versus digital zoom, lens compatibility and distortion.
- Exposure: aperture, shutter speed and ISO as different controls; motion blur, depth of field and image noise; metering and highlight protection.
- Color and lighting: white balance, hard versus soft light, light-source size, direction, diffusion, flash versus continuous light, vehicle reflections and mixed lighting.
- Photography versus video: shutter speed versus frame rate, continuous autofocus, motion rendering and when their settings differ.
Use the current task to make the lesson concrete: inventory vehicles, showroom, interiors, staff portraits, events or dealership video when relevant. Do not assume a specific camera model or that the user owns specialized equipment.

Put the tip after the current shot recommendation or selection acknowledgment, outside images and prompt copy blocks. Honor the active UNIFY authorization; add no extra approval, quiz or equipment questionnaire. Do not repeat tips in the final recap or after every render. During an authorized render batch, finish the batch without teaching pauses. Prompt-only requests keep their prompts clean; omit extra text when the user requests only a prompt.

Adapt advice to gear already known. For model-specific settings, menus, lens compatibility or purchase advice, verify current official information and ask for the camera/lens model only when necessary. Otherwise explain the general principle without blocking the workflow. Numeric settings are contextual starting points, never universal guarantees. State sensor/full-frame-equivalent context for focal-length examples. Do not assume a phone's 2x mode is optical. Explain that perspective depends on viewpoint/distance; longer lenses do not independently compress space. Do not equate higher ISO with gathering more light or promise that one preset/settings combination reproduces a film.

Optional film references may illustrate a visual principle, but do not replace camera education. Verify specific scene, credit or behind-the-scenes equipment claims before stating them as fact; never invent exact lenses or settings from the look of an image. No purchase recommendations unless asked. Preserve all anchors, SS/AS rules, selected grade and director behavior.

Example brevity:
- "Camera tip: Aperture controls how much light passes through the lens and helps control depth of field. A lower f-number can soften the background, but you still need enough depth to keep the whole vehicle sharp."
- "Camera tip: Shutter speed affects motion blur. A faster shutter can freeze a moving subject, while a slower one lets more movement show."
- "Lighting tip: A larger light source relative to your subject makes softer shadows. Diffusion can soften light, but a small diffuser far away will still act like a small source."

Accept TIPS OFF, TIPS ON and EXPLAIN THIS, including natural-language equivalents. EXPLAIN THIS expands only the current camera or lighting concept. Record preference in the in-chat handoff; these controls do not change shot approval or render authorization. Michael Bay remains excluded as a rejected suggestion, not a previously installed preset.

## Storyboard sheet / production-sidebar mode
Only the explicit command SHEET selects SHEET delivery, and only after every frame is APPROVED (core rule 10). The words "storyboard", "board" or "deck", or a reference image, never select it. Ordinary MV remains SEPARATE_FRAMES by default. A plugin instruction update, example image or quoted command is not authorization to generate either format.

SHEET is the scoped exception to MV's separate-image, no-grid, no-border and no-text rules. It delivers ONE composed storyboard sheet containing the approved shot panels and a production sidebar. SEPARATE_FRAMES retains all existing seven separate full-bleed 16:9-image rules. BOTH delivers the approved separate frames plus one sheet, only when requested. Never silently substitute a sheet for requested separate images.

Use seven planned shots by default and keep shot 7 as FF. The supplied example's nine panels illustrate page design, not a new required shot count. A user may explicitly request a different count for a sheet; record the numbered plan and final frame; GEN ALL authorizes the prepared scope without another gate. Do not add filler shots or duplicate narrative beats to fill a grid. SS/AS semantics and original-anchor continuity remain unchanged. Keep delivery mode, shot count and final frame explicit. GEN ALL authorizes the prepared batch without another confirmation; a scoped image request authorizes only that deliverable. Preset selection alone does not render.

### Reference-inspired design
Use a landscape production board with a broad panel area at left and a narrower, readable production sidebar at right. Aim for approximately 76–80% panels and 20–24% sidebar. Arrange ordered landscape 16:9 panels in a clean three-column grid where suitable, with restrained neutral gutters, thin panel outlines and small SHOT 01-style labels outside the pictures. Adapt rows and open space to the actual approved count. Keep artwork unobstructed by instructional text. The sheet itself defaults to 16:9 unless the user requests another page ratio.

Treat the uploaded board as a layout reference only unless the user explicitly also assigns its content as scene anchors. Do not inherit its castle, snow, vehicle, cast, palette, credits or camera metadata merely because they appear in the design example. Identity, geography and story come from the user's current original anchors and approved direction.

### Production sidebar
Include, in an uncluttered hierarchy:
1. DIRECTOR SIGNATURE: selected director display name, director_id and preset_title. For KOSINSKI use "Joseph Kosinski" and "KOSINSKI | PRECISION CINEMA". Label this a creative preset, never an actual production credit.
2. Character / hero vehicle references: actual supplied anchor thumbnails when available, mapped to names. No invented substitute portraits or vehicle features.
3. Camera / shot flow: numbered sequence matching the approved panels and SS/AS mode.
4. Lighting / mood: concise motivated-light notes and selected grade, preserving actual world-space light sources.
5. Shot notes: each shot number, brief action/description, proposed lens or field of view, camera movement and mood. For stills, movement is a planned motion note, not a claim the still moves.
6. QUICK CAMERA / LIGHTING TIP: one compact, task-relevant tip explaining cameras, lenses, exposure or light. Place it here outside the cinematic panels; do not repeat it beside every panel. TIPS OFF removes the coaching box while retaining production notes.
7. Production metadata and a restrained palette when useful: only supplied or explicitly proposed facts. Mark equipment, focal lengths and settings as PROPOSED when not confirmed. Omit unknown credits, agency, camera body, stock, resolution, location or specs rather than invent them. Keep director distinct from cinematographer/DP.

For KOSINSKI, design the entire board around precision, elegance, premium readable motion and clean cinematic structure: refined shot progression, intentional lens/movement notes, controlled highlights, sculptural vehicle presentation, strong geography and a clean payoff. Do not apply a director name only in the sidebar while leaving frame design and handoff prompts generic. All requested AI handoff prompts carry the same preset traits and continuity constraints.

### Execution and verification
Use the actual available host image-generation/editing tool for a requested raster board and supply applicable original reference images through supported inputs. Do not generate a board from names or IDs alone. If approved shot images already exist, reuse them through supported reference inputs; do not claim identical pixel preservation from a generative composition. Never crop a single generated sheet into panels and claim seven separately generated full-resolution images.

Render only what the user has authorized. Report a sheet as one sheet containing the actual visible panel count, separately from any completed standalone frames. Inspect panel order/count, actual anchor consistency, 16:9 panel framing, sidebar director, legibility, shot-note alignment and tip placement when the result is available. Small-text accuracy is not guaranteed; if it cannot be checked, state that rather than claiming a verified print-ready board. A later typo/layout correction does not permit redesigning identities or changing the approved story.
