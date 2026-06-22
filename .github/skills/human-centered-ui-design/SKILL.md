---
name: human-centered-ui-design
description: Design interfaces that work for real humans—especially those with ADHD, older adults, or people without tech skills. Focus on clear workflows, accessible language, and one obvious next step at a time.
category: UX/Design
audience: All team members building UI, forms, workflows, or dashboards
---

# Human-Centered UI Design Skill

## Why This Matters

Most software is designed by people who:
- Are comfortable with technology
- Have no attention challenges
- Know all the jargon
- Can hold complex mental models

Real users often:
- Get distracted or overwhelmed easily (ADHD)
- Need bigger text and clearer labels (older adults)
- Don't know tech terminology
- Need one obvious next step at a time

**This skill ensures your interface works for actual humans.**

---

## Core Principles

### 1. **Clear Purpose First**
Every section/page should have ONE clear purpose.

❌ Bad: "Your Blog Space" with settings form, photo upload, post manager, and technical docs all mixed together
✅ Good: Separate into:
- "Your Profile" → just photo + name (set once, done)
- "Your Posts" → create/manage posts

**Ask:** "What is this page FOR? What does the user do first?"

### 2. **One Obvious Next Step**
Users should never wonder what to do next.

❌ Bad: Multiple equally-weighted buttons/options; unclear priority
✅ Good: One primary action (button) per section; secondary actions below

**Ask:** "If someone's on this page for 30 seconds and distracted, what's THE thing they should do?"

### 3. **Eliminate Jargon & Cruft**
Replace technical language with human language.

❌ Bad:
- "Profile Image (16:9)"
- "Recommended 16:9 at 1600x900"
- "Signed in as jessie_v · Full CRUD on your own posts only"
- "Initialize signed upload intent"

✅ Good:
- "Your Photo"
- "Drop it here or click"
- "Drafts: 0 · Published: 0"
- "Uploading..." (just show progress)

**Ask:** "Would a 70-year-old understand this? Would someone unfamiliar with tech get it?"

### 4. **Respect Cognitive Load**
People with ADHD, older users, or non-tech-savvy people have lower cognitive bandwidth.

❌ Bad:
- Massive full-screen upload zone
- Multiple repeated settings forms
- Technical documentation inline
- Long dense paragraphs

✅ Good:
- Compact, focused components (320px not full-width)
- One setting per card
- White space and visual separation
- Short, scannable text

**Ask:** "Can someone scan this in 5 seconds and understand it?"

### 5. **Use Familiar Patterns**
People understand Facebook, Instagram, email—use those mental models.

❌ Bad: Inventing new interaction patterns; unique layout
✅ Good:
- Profile photo prominent at top (like Facebook)
- Stats inline with name (like Instagram)
- Post list (like Twitter/email inbox)
- "Edit Profile" button for one-time setup

**Ask:** "Does this feel like something they already use?"

### 6. **Make One-Time Setups Obvious**
If something should be set once and forgotten, make it clear.

❌ Bad: Blog name mixed into repeating "channel settings" form
✅ Good: Clear "Profile Setup" section separate from ongoing management

**Ask:** "What's set once? What changes regularly? Keep those separate."

---

## Design Checklist

Before shipping any interface, ask:

### Information Architecture
- [ ] Is there ONE clear purpose for this page/section?
- [ ] Are related things grouped together?
- [ ] Is "set once" info separate from "ongoing management"?

### Language & Labels
- [ ] Does every label explain what it does in plain English?
- [ ] Have I removed all jargon (or explained it)?
- [ ] Is the description SHORT (one line)?
- [ ] Would a teenager understand it? A grandparent?

### Cognitive Load
- [ ] Is the screen visually calm (white space, not crowded)?
- [ ] Is there ONE primary action per section?
- [ ] Would someone distracted still complete the task?
- [ ] Can someone understand it in <10 seconds?

### Buttons & Actions
- [ ] Is the primary action obvious (bigger, colored)?
- [ ] Do secondary actions exist but don't distract?
- [ ] Is the button text a verb ("Save", "Create Post", not "Submit")?
- [ ] Does every button have a clear result?

### Accessibility
- [ ] Large enough text? (18px+ for important text)
- [ ] High contrast labels/buttons?
- [ ] Is it mobile-friendly (thumb-sized touch targets)?
- [ ] Does it work for keyboard navigation?

### Familiar Patterns
- [ ] Does this look like something people already know?
- [ ] Are common interactions in expected places?
- [ ] Would a Facebook user recognize this flow?

---

## Real-World Example: Blog Admin Redesign

### Before (Technical, Overwhelming)
```
"Your Blog Space"
  "Set your blog identity and profile image for your public channel page"
  - Channel Name input (repeating field)
  - Profile Image (16:9) upload (FULL SCREEN 16:9 zone)
  - "Recommended 16:9 at 1600x900" (jargon)
  - "Public channel path: /your-local-blog/channel/jessievblog" (unnecessary detail)
  - "Save Channel Settings" (vague)

"Jessie Dashboard"
  - "Signed in as jessie_v · Full CRUD on your own posts only" (jargon cruft)
  - Drafts: 0 · Published: 0
```

### After (Human-Centered, Clear)
```
"Jessie Dashboard"
  - Drafts: 0 · Published: 0
  (just stats, nothing else)

"Your Profile" ← One purpose: set photo + name (ONCE)
  This is how you show up to your audience.

  [Photo upload - 320x200px, centered, with visual guide]
  Drop it here or click

  Blog Name: [text input]

  [Save button]

"Your Posts" ← Other purpose: create/manage
  [New Post button - PRIMARY]
  [Post list below]
```

**Changes made:**
- ✅ Removed jargon ("CRUD", "channel path", technical copy)
- ✅ Shrunk upload zone (320px, not full-screen)
- ✅ Separated profile setup (one-time) from post management
- ✅ One primary action per section
- ✅ Friendly language ("This is how you show up")
- ✅ Clear stats without cruft
- ✅ Used familiar pattern (Facebook-like profile)

---

## When to Apply This Skill

Use this skill when designing:
- **Forms** (especially multi-field)
- **Admin dashboards** (confusing + overwhelming by default)
- **User onboarding** (first impressions matter)
- **Settings pages** (easy to make overwhelming)
- **Call-to-action flows** (photo uploads, submissions, etc.)
- **Any page where users might be older, have ADHD, or aren't tech-savvy**

---

## Anti-Patterns to Avoid

❌ **Too Much On One Page**
"We can fit it all here!" → User gets overwhelmed, leaves

❌ **Jargon & Technical Language**
"Initialize payload" / "DML operation" / "CRUD" → User confused, asks for help

❌ **No Visual Hierarchy**
All buttons same size, all text same size → User doesn't know where to start

❌ **Repeating Settings Forms**
Blog name in setup AND in every channel card → Cognitive burden, confusing

❌ **Massive UI Elements**
Full-screen drag zone for a simple upload → Feels broken or like a mistake

❌ **Multiple "Next Steps"**
Three equally-important buttons → User paralyzed, does nothing

---

## Questions to Ask Your Team

When reviewing a design:

1. **Purpose:** "What's the ONE thing someone does here?"
2. **Language:** "Would my grandpa understand this?"
3. **Flow:** "What's step one? Step two? Is it obvious?"
4. **Overwhelm:** "Does this feel busy or calm?"
5. **Familiar:** "Does this remind me of apps I already use?"
6. **Action:** "What button do I click first?"
7. **Cruft:** "Do we really need that?"

If you can't answer these clearly, redesign.

---

## Example Prompts to Try This Skill

- "Redesign this form for an older user with no tech skills"
- "Remove jargon from this admin page and simplify the workflow"
- "Is this interface overwhelming? How would someone with ADHD handle it?"
- "What's the one main thing a user should do here? Make that obvious"
- "Could a 10-year-old use this? A 70-year-old?"

---

## References

- **Don Norman**, The Design of Everyday Things
- **Steve Krug**, Don't Make Me Think
- **WCAG 2.1** Accessibility Guidelines
- **A/B Testing with Older Adults** & ADHD populations
