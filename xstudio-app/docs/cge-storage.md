# CGE storage and explicit saving

The existing seven factory definitions are unchanged. Custom grades use the existing project manifest's color_grades.custom and append-only version history. No table migration or data rewrite is needed.

The site accepts native grades or XCE_COLOR_GRADE objects. Canonical profiles remain intact under cge_profile; additional tonal parameters and source_prompt are retained. The prompt generator includes those parameters. Numeric RGB preview sliders are relative guidance, not Kelvin, a recovered film stock, halation simulation or a real LUT.

## Editor
Color Grades → Add grade, Stage grade JSON or Paste a CGE or native grade → Review → edit → Save custom preset.
Importing/pasting and choosing a preview do not save a preset. Factory grades must be duplicated before editing. Saving a grade does not assign it to shots or regenerate any image.

## Owner-session REST endpoints
These site routes use the authenticated verified-owner browser session and folder access, not a public unauthenticated API or a new credential type. The XCE MCP connector continues to use its existing authenticated manage_color_grade tool and native adapter.

GET /api/color-grades?project_id=<project>
Returns { project_id, revision, grades }, retaining native factory definitions and cge_profile on canonical custom grades.

POST /api/color-grades?project_id=<project>
Body { confirm:true, expected_revision:<current project revision>, profile:<canonical XCE_COLOR_GRADE> }
Creates a new ID only; rejects a collision rather than overwriting.

PATCH /api/color-grades/<grade_id>?project_id=<project>
Body { confirm:true, expected_revision:<current project revision>, expected_version:<current grade version>, profile:<complete revised canonical profile> }
Updates the named custom grade only, preserves native controls/reference linkage and stores history. Rejects ID mismatches and stale revisions/versions. Mutations require the trusted same-origin owner session. Native grade bodies remain supported by the existing authenticated /api/manage route.

A successful REST write performs readback and returns saved:true, status:PUSHED, project/revision and the stored native grade. The original canonical status is retained; PUSHED is a synchronization receipt, not an automatic shot or anchor approval.

The plugin's proposed OpenAPI v1.2 document is not the exact authentication/envelope contract of these owner-session routes. Do not connect it as a public bearer API or claim automatic synchronization.
