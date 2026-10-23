# Platform inputs and voices

For generic PTP/PTPRL/PTPCB, follow prompt-this-picture.md: one standalone generator-neutral prompt, no platform-selection question or research requirement. The platform research below applies only when the user requests a specific target adaptation.

## Flow adapter
Support Google Flow as an explicit target workflow. This plugin packages instructions and prompt validation; it does not itself grant Google login, install a Flow API/connector, or create characters inside Flow. Use a supported browser/integration only when available and the user's task authorizes it. Otherwise deliver copy-ready fields without pretending they were submitted.

User-provided Flow UI screenshots (2026-09-24) establish portrait/body, optional character info, voice selection, sample dialogue and performance fields. The sample UI shows 0/120. User requires BOTH dialog and voicePerformance to stay at most 120 characters including all spaces/punctuation. Treat 120 as a maximum, not an exact length. Do not pad. Count the final literal field values, excluding external titles/count labels. Prefer plain punctuation and no emoji/control characters; validator checks Unicode code points and UTF-16 units to avoid underspecifying UI counters. Do not put count labels in copyable text.

For a requested character package deliver ONE separate fenced text block per input, title outside:
- Portrait prompt: same approved identity, face, hair, markings, needed accessories and style; focus on face/upper torso. Not the entire anchor layout.
- Body prompt: same identity and approved build/outfit/equipment, complete silhouette. Describe the body mode the user actually has; do not assume extra inputs or three separate body prompts.
- Character information: concise approved behavior/personality/role for the pictured 'Describe how your character acts' field. Do not invent personality or biography from physical appearance. Keep this distinct from the anchor's visual character prompt. Ask one question if essential personality is undefined; optional fields can be omitted instead of filled with fiction.
- Base preset: select one name from voices.json, based on intended voice; do not claim to synthesize custom audio by writing text.
- voicePerformance: approved accent/register/cadence/emotion/delivery, <=120.
- dialog: spoken character preview line, <=120. No stage directions embedded as speech unless requested.

Give the package when requested or on its guided step, not automatically after every bare MCS command. Simple MCS returns only the finished named anchor. Complex MCS also returns its reusable visual character prompt. Neither automatically starts the Flow package. For voice selection use current available preset labels, then tune performance. Do not infer a preset's gender or pitch from its name. Never call a base voice an exact replica of a real person.

## Source policy
voices.json is a dated baseline transcribed from the user's three library screenshots; cropped labels stay unspecified. The pasted prose list contained conflicting gender/timbre claims and is superseded by screenshot labels. Google Gemini TTS documentation corroborates preset names/descriptors; it does NOT prove that every API feature or voice is enabled in the user's Flow account.

Official references checked during this build:
- https://ai.google.dev/gemini-api/docs/speech-generation
- https://support.google.com/flow/answer/16353334?hl=en
- https://support.google.com/flow/answer/16935308?hl=en
Use current official documentation or the user's current visible UI to verify changing features. Cache verification per project/session and recheck when stale or contradicted; do not browse for every repeat use of an unchanged supplied preset. Never claim a live voice-library lookup if it failed. Keep the user's baseline available and disclose the limited verification when relevant.

For Kling.ai, Omni or another requested model, first identify exact product/model/interface (ask only if genuinely ambiguous). Research official supported reference roles, text limits, first/last frames, aspect ratios, duration, motion/voice support, and prompt syntax. Record source/date and unsupported features. Never copy Flow's 120-character rule to another platform or silently alter a locked anchor to optimize for a model. Don't guess what 'Omni' means or invent tool access. Return one prompt per actual input. If documentation is unavailable, use supplied UI evidence or clearly label unverified assumptions rather than advertise compatibility.
