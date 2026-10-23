# Fixed name and labels for simple sheets
This replaces model-drawn simple-sheet typography. The final deliverable is a self-contained SVG production document, 1920x1080, with the actual generated image embedded and fixed text below it. It is not merely a promise in a prompt.

1. Generate the text-free six-column artwork using the current identity references. Aim for 1920:980 for its image region. Do not generate footer text. Follow all source-isolation and safety rules.
2. Inspect the actual artwork: front body, exact side body, three-quarter body, rear body, front face, exact profile face, all in one row. Four-plus-two arrangements fail. Reject screenshots, missing feet, cropped faces, identity drift and non-gray settings. Use the existing single retry if necessary.
3. Save an inspection JSON: source_path (absolute actual file path), inspected=true, layout="six_columns", views (the contract's ordered list), body_and_face_framing_ok=true, gray_studio=true, identity_and_wardrobe_ok=true, text_free=true. These are visual observations, never inferred from the request or fabricated. The script cannot examine image semantics.
4. Run: python scripts/finish_simple.py --image <actual image> --name <exact supplied name> --inspection <review.json> --output <new file.svg>
5. Inspect a rendered preview, then deliver the completed SVG document as a named-sheet download/preview with an actual file link. When Inkscape is available, export the SVG document with: inkscape <final.svg> --export-type=png --export-filename=<final.png>. Inspect the rendered PNG and present it as the primary finished sheet, with the SVG available as its editable document. If a renderer is unavailable, deliver the SVG honestly and do not claim a PNG was made. Never claim SVG is PNG or that a raw generator preview includes the fixed name.
6. Keep the original generated artwork and references unchanged. Do not overwrite source files. Record the final document as the delivered draft and keep the ordinary user-approval distinction.

The script validates the observation record, not pixels. It preserves the source image's aspect ratio using contain/meet, with gray space if needed; it does not crop or stretch people. The name is escaped as text, sized to fit with margins and centered in the footer. Long names that cannot remain legible are rejected. No generated lettering is trusted.

