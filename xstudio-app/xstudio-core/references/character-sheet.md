# Standard character anchor

## Safe styling default

Apply the governing Safe sheet adaptation rules to every sheet, even without a "no nudity" instruction. Ordinary adult swimwear in a non-explicit source is clothing; preserve it for neutral adult six-view turnarounds under the governing rule. Do not infer sexual intent from body shape or the required view angles. Use clothed, non-explicit, age-appropriate styling and neutral reference poses. Rewrite problematic styling into a permitted alternative while preserving the six-view sheet and identity. A refusal is not permission to bypass safeguards; report an unresolved block honestly and preserve the pending job.

## Style-edit mode

`MCSRL/MCSCB [name] EDIT [style or vibe]` keeps this entire sheet contract. Accept lowercase/mixed case, optional dash, colon and multiline edits. Treat EDIT as a subordinate appearance modifier applied consistently to all six views; it never changes the deliverable to a photoshoot, selfie, poster or collage. Preserve RL/CB medium and simple/complex mode. Follow-up modifiers, including after a failed attempt, remain attached to the pending sheet. Vibe language is not permission for nudity, body changes, decorative captions or a layout override. Use only explicit appearance changes and preserve other identity features.

## Automatic medium
When no RL/CB medium is explicitly supplied, apply the automatic-medium rules in SKILL.md: comic-book/illustrated upload -> CB; photographic/photorealistic person -> RL. Explicit medium overrides this inference. The chosen medium never changes the selected layout or visible-name requirement.

## Fixed visual contract
Every MCSRL/MCSCB sheet uses a 16:9 landscape gray studio/reference-board layout (simple neutral gray; complex neutral light gray). RL uses photographed/live-action materials and believable practical costume/creature treatment; CB uses mature detailed comic linework and controlled painterly shading. Neither implies game UI, RPG statistics, poster decoration, random biographies or expression grids.

COMPLEX ONLY: Top-left: black rectangular badge, white lettering, the supplied character name only. Preserve explicit casing; `mcsrl andy` yields `andy`, unless user specifies `Andy`. No syntax brackets or command tokens. Top-right: CHARACTER REFERENCE SHEET | MODEL SHEET ANCHOR.

COMPLEX upper-region arrangement (simple uses the six-column arrangement below):
1. Front full body, first tall column.
2. Exact 90-degree side full body, second tall column.
3. Three-quarter full body, third tall column.
4. Rear full body, fourth tall column.
5. Front bust, upper right.
6. Exact 90-degree profile bust, lower right.

Use the same side for the full-body profile and profile bust; default character left side visible. Preserve approved asymmetric equipment placement across rotations (anatomical left is not image-left). Four body views are the same scale, share a baseline, show head-to-toe and all extremities/tail/equipment with margins. Use neutral anatomy-appropriate stance and soft even lighting. Do not demand both feet be separately visible in a true profile where occlusion is natural. Both portrait panels are FACE PORTRAIT CLOSE-UPS: complete head, hair/crown, face, chin, neck and shoulders; crop near the upper chest. The face is the focal subject and occupies most of the panel height. Never crop off the head, eyes, nose or chin; never center the chest or breasts. Front portrait (simple column 5; complex upper right): face looking straight forward. Profile portrait (simple column 6; complex lower right): exact 90-degree side face, with the forehead-nose-lips-chin silhouette clear, eye visible on the near side, no three-quarter turn. For nonhumans show the complete corresponding head anatomy. Use "front face portrait, head and shoulders" and "90-degree profile face portrait, head and shoulders" in the image instructions rather than the ambiguous word "bust" alone.
The mode-specific neutral gray studio applies inside ALL six panels as well as the board. Ignore the reference photo's room, outdoors, backdrop and camera framing. Preserve identity and requested wardrobe, not source scenery. A styling edit does not override this studio requirement.

## Simple versus complex
Use the user's selected mode. Keep that mode for the active asset. If none is established, infer simple for an ordinary person/basic character with no need for separate reconstruction panels, and complex only when visible distinctive equipment/details need reconstruction. Do not choose complex merely to fill the page; ask only if the choice is materially unresolved.

SIMPLE: exactly six full-height columns across one 16:9 sheet, in this left-to-right order: front full body, exact 90-degree side full body, three-quarter full body, rear full body, front face portrait, exact 90-degree profile face portrait. The last two columns are close-ups, not full bodies. All six share the same image-region height; do not stack portraits. Use neutral gray studio in every column, narrow black vertical separators, a narrow black numbered-label strip beneath the images, and the supplied name centered in white in a black footer below the labels. No top title badge or top-right header. Preserve supplied name casing. Labels describe the six views; no command tokens or plugin branding, including the example's small command watermark. This user-approved arrangement replaces the old simple stacked-bust template for both RL and CB; only the rendering medium changes. Keep all feet and head tops visible with safe margins in body views. Treat the approved Roxy example as layout-only, never a source of identity or wardrobe for another character. No separate props, weapons, equipment, detail/callout, expression, description or character-prompt panels. No blank slots or filler text. No unsolicited copyable character prompt after the image. Preserve source wardrobe and naturally worn/held items within the six character views; this does not authorize separate item panels or invented objects.

COMPLEX: retain the six view types in the complex arrangement above (four body columns and two stacked right-hand portraits). Inspect the assigned reference images before choosing any prop/weapon/equipment panel. Include an item only when it is actually visible AND a separate view is needed for reconstruction. Record each selected item in equipment_evidence with item, source_id, visible=true, needed=true and a concrete reason. The source must be an accessible, supplied/locked identity, body, wardrobe or equipment reference; layout/style examples cannot supply items. Do not treat a suggested loadout, character class, biography, title, genre or unseen object as visual evidence. If an essential item is unclear, ask for its reference; otherwise omit it. Never invent variants, duplicate items, add decorative accessories, or populate unused slots. Zero selected items means no equipment row at all, even in complex mode.

Complex DETAILS & CALLOUTS are optional: include only visible details necessary for reconstruction, with the same evidence fields in detail_evidence (item matches the detail label). Omit unnecessary or duplicated details and their panels entirely. Never use expressions or arbitrary details to fill spare space.

Complex only: keep the CHARACTER PROMPT panel with a concise 45–85 word standalone visual reconstruction prompt using known traits, no lore or speculation. Repeat its exact text as selectable text in its own fenced block after the image, with 'Character prompt' outside. No color palette or swatches in either mode. Do not invent content to occupy empty space.

## Equipment intake without unnecessary questions
For complex sheets, visible evidence and reconstruction need determine selected equipment; user choice can narrow that selection. A text-only request for new equipment does not count as having scanned it in a reference. Handle an explicit redesign separately before using its reviewed visual result as evidence. For simple sheets, equipment and details arrays are always empty; never ask about loadout to populate panels. Preserve existing source items on the character without extracting them into extra panels.

Model-only details that are unseen remain draft inferences. If a required rear view depends on a critical unknown (tattoo, armor emblem, backpack attachment), ask once for that specific detail/reference. In guided creation propose missing design details, and lock only on approval. Do not force names early during brainstorming, but require a supplied name or explicit temporary identifier before a named final sheet.

## Fixed typography for simple sheets
For simple mode, generate only the six-column artwork strip and then follow simple-finishing.md to typeset the labels and exact supplied name in the final 16:9 production document. The dimensions and footer described above specify the final document, not text the image model must invent. The finished SVG embeds the image; its name is fixed text. Keep the artwork's aspect ratio and all body/face margins. Missing source access is a blocker to this deterministic finishing step, not permission to claim it ran.

## Visible-name acceptance
Apply the mandatory visible-name completion gate in SKILL.md. Simple: exact supplied name in white, centered in the black bottom footer inside the canvas, below the six labels. Complex: exact supplied name in its top-left badge. Missing, misspelled, illegible or cropped names fail review. Chat text and filenames are not visible image labels. Inspect the output before recording observations; use guardrails.py --review for the recorded result.

## Before and after each generation
Read contract.json; validate the job record; inspect the actual result. Check the mode-specific gray studio in all six panels, complete face and head in both face portrait panels (no chest-only crop), title, exact six view assignments, consistent side profiles, rear visibility, anatomy, identity, costume, handedness, full silhouette, equipment count, readable prompt (complex only), no palette, no unapproved extra poses/panels. More equipment does not authorize changing the main grid. For too many approved items to remain legible, ask whether to put overflow on a separate equipment sheet; never crop, silently omit, or invent a seventh character view.

The old five-view spec and reversed bust order have been superseded. The old simple stacked-portrait layout is also retired; stacked portraits remain complex-only. Uploaded visual examples provide only their assigned role. The original ten-slot/palette template is not the current contract. Use scripts/template.py --artwork-only for simple generation (labels/name are added by the finalizer), and the ordinary complex template for complex generation. Do not feed obsolete layout examples into generation.
