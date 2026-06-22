# Compact Blog Channel Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present the blog channel artwork in a compact 16:9 hero with readable channel information in a small left-side panel.

**Architecture:** Keep the existing page markup and image data flow. Implement the approved presentation entirely in the existing blog-channel CSS, including one mobile breakpoint.

**Tech Stack:** Next.js 14, React 18, CSS

---

### Task 1: Compact the public channel hero

**Files:**
- Modify: `studio-production-suite/app/globals.css`

- [x] **Step 1: Replace the oversized minimum height**

Set the hero to `aspect-ratio: 16 / 9`, cap its height, and prevent it from taking over the first viewport.

- [x] **Step 2: Add the left information panel**

Give `.blog-channel-hero-content` a compact width, translucent dark background, border, blur, padding, and restrained typography.

- [x] **Step 3: Preserve tasteful image presentation**

Keep the cover at full hero size with `object-fit: cover`, add a restrained image opacity, and use a subtle left-side overlay behind the text.

- [x] **Step 4: Add mobile behavior**

At the existing mobile breakpoint, reduce the hero height and let the information panel occupy the available width without covering the entire image.

- [x] **Step 5: Verify**

Run:

```bash
npm run build
node --test tests/blog-channel-hero.test.mjs tests/google-analytics.test.mjs tests/admin-user-groups.test.mjs
```

Expected: production build succeeds and all nine tests pass.

Open `http://localhost:3000/blog/channel/xrkr80hdblog` and confirm the 16:9 artwork, compact left panel, readable text, and visible first post.
