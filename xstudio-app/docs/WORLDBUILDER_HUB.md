# World Builder hub and portable export

The private plugin is XCE_WORLDBUILDER. `new_world` starts a one-question-at-a-time dialogue: name → saved project → World Builder → character/category records → relationships/synergies → scenes → color grading → export. Its package houses the existing XCE instruction modules and connects to the same authenticated `/mcp` server. Existing standalone plugins remain unchanged.

New MCP operations:

- `get_world_builder`: saved World Builder, compiled roster/context, actual character network and field/form schemas.
- `update_world_builder`: native World Builder validation and revision-checked patch saves; omitted fields remain unchanged.
- `create_world_asset`: a named DRAFT character/creature/wardrobe/prop/vehicle/location/room/scene-category record before images exist; no fabricated images or approval.
- `update_character_profile`: native gender, quick-details and complete linked-rule updates with cycle/identity validation; omitted fields stay unchanged.
- `export_world`: owner-authenticated ZIP/JSON download paths for the chosen project.

The website now has primary destinations for Worlds, World Builder, Characters & assets, Scenes, Color Grades and Export. Prompt engines, continuity tools, older workspace controls and connection settings remain under Advanced. Existing projects, references, data, grades and presets are retained. Saved World Builder sections start collapsed; the legacy tagged-text import is available separately.

`GET /api/world-export?project_id=P` streams a portable ZIP after owner login and folder authorization. It contains `world.json`, `DIRECTOR_BRIEF.md`, original `images/` and computed `media-index.json` hashes. `&format=json` downloads only the structured document, with paths referring to images in the ZIP. The exporter removes private object keys, lock/session/credential fields, delegation markers, permits and trash. It checks original size, available stored/approval hashes and MIME metadata before adding images. It never screenshots, regenerates or substitutes originals. Original files are capped at 6 MiB each; an export at 1,000 references / 200 MiB of media. A missing or changed original aborts the download. The streamed archive is not a public upload or stored export copy.

InVideo/OpenArt and other director studios may accept different formats. Extract the ZIP where needed, upload the readable brief/structured document and the supported original references. The user's supplied InVideo notebook is a destination example, not evidence that this application can import there automatically. No cross-service compatibility, renderer-reference transfer or absolute visual-continuity guarantee is claimed.

Local workspace tests cover World Builder patches, draft character creation, character gender/synergy persistence and export discovery. Hosted tests also unzip the produced archive and compare exact image bytes/hashes. The normal Next.js build validates the UI and route. Signed-in visual checks, live world export downloads, ChatGPT's plugin mention/discovery and destination-specific imports require separate end-to-end verification.
