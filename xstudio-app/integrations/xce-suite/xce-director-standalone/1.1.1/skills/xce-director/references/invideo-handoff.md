# INVIDEO HANDOFF — the one brief ChatGPT sends to @invideo

Core rule 8 requires this file. Fill the template below exactly, show it in the chat with the
ticked SEND CHECK, then send it to @invideo in ONE message with every file attached.
Don't paraphrase, shorten or reorder the template. Fill it only from the approved review list
and SCRIBE's script as they stand, never from memory.

## How invideo works (why the brief looks like this)
- invideo in ChatGPT is an agent. It generates video in clips of about 15 seconds and routes
  each shot to a model; for locked identity it uses reference-to-video (e.g. Seedance 2.0),
  which generates native dialogue, ambience and sound effects with the footage.
- In Always Ask mode it shows each shot's prompt, references, model, length and credit cost
  before generating, and waits. Always request it: it's a second review gate and it protects
  credits.
- It holds identity through locked references: images assigned to named characters, then
  "lock character v1 and use it as the reference for all subsequent shots". Lock one tier at a
  time: characters, then locations, then vehicles and props.
- It reads file names as metadata, so the rule 4 and rule 6 names carry the labels and order.
- An approved storyboard frame can be the keyframe for its clip.
- It adds music unless told not to, and has no documented music-off switch. The brief forbids
  music outright, and invideo must confirm "no music track" before export. Muting is never used
  (it would also remove dialogue and natural sound).
- If ChatGPT can't attach the files through the connector, it says so and lists the exact files
  for the user to drop into the invideo chat. Their names already carry the labels and order.

## Files to attach (in this order)
1. Every anchor used: <CODE>_<Display-Name>.png  (e.g. FF6-CH-TERRA_Terra-Branford.png)
2. Every APPROVED frame (latest version): <PROJECT CODE>-<SCENE>_<NN>of<TOTAL>[_v2]_<slug>.png

## Template (copy exactly, fill every <…>)
```
@invideo — XCE production brief. Follow it exactly. Do not improvise, add, drop, merge,
reorder or restyle anything.

MODE: Always Ask. Before each generation, show the prompt, attached references, model, length
and credit cost, and wait for my approval.

PROJECT: <Title> (<PROJECT CODE>-<SCENE>) · <runtime> s · <16:9 | 9:16> · <N> shots ·
final export H.264 MP4
LOOK: <one line: live-action photoreal, grade, lens, lighting>. No on-screen text in footage.
AUDIO: Native audio only: dialogue, ambience and sound effects generated with the clips.
Do not add any music, score, song or background track at any stage, including the final edit.
Do not mute the clips.

STEP 1 — LOCK REFERENCES (attached; file names are the labels). One at a time, in this order:
- <CODE>_<Name>.png = character "<Name>". Lock character v1 and use it as the reference for
  all subsequent shots.
- <…repeat for each character…>
- <CODE>_<Name>.png = location "<Name>". Lock location v1 for all shots set there.
- <CODE>_<Name>.png = vehicle/prop "<Name>". Lock v1 for every shot it appears in.

STEP 2 — KEYFRAMES. Each approved frame is the first frame of its shot. Use it exactly as
supplied; never regenerate or restyle it.
- <PROJECT CODE>-<SCENE>_01of<N>_<slug>.png → Shot 01
- <…one line per shot…>

STEP 3 — SHOTS, in this exact order:
Shot 01 · <0:00–0:05> (<5> s) · keyframe <file>
  Starts: <start state>
  Action: <one action>
  Camera: <one move>, <lens>
  Dialogue: "<exact line>" (<speaker>)   |   Dialogue: none
  Sound: <native sounds only>
  Ends: <end state>
  Into Shot 02: <cut | match cut | dissolve>
<…repeat for every shot. Shot N's "Starts" = Shot N−1's "Ends"; durations sum to the runtime…>

STEP 4 — CONTINUITY. Same locked references in every shot. Each shot starts exactly where the
previous one ended. For continuous action across a cut, use the last seconds of the previous
clip as a reference.

STEP 5 — ASSEMBLE AND EXPORT. Put Shots 01–<N> on one timeline, in that order, with the
transitions above. Overlays: <exact title/price/CTA text and time> | none. Confirm the timeline
has no music track, then export a finished <aspect> H.264 MP4.
```

## After invideo answers
- At each Always Ask gate, check the shown prompt and references against the brief. Approve only
  if they match; otherwise correct that one shot, quoting the brief.
- Returned clips go through the XCE review gate (core rule 7). Any music, stock footage or a
  restyled keyframe means R, not A.
