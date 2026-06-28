# Blog Channel Profile Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overlay each displayed blog channel owner's square profile picture on that channel's cover without crossing the cover's vertical center line.

**Architecture:** Keep the existing channel-specific `avatar_url` and `card_image_url` data flow. Move only the avatar markup into the existing positioned hero and add responsive CSS that sizes and anchors it within the upper-left half.

**Tech Stack:** Next.js 14, React 18, CSS, Node test runner

---

### Task 1: Guard the avatar placement

**Files:**
- Test: `studio-production-suite/tests/blog-channel-hero.test.mjs`

- [x] **Step 1: Write a failing response-markup test**

Assert that the channel avatar appears after the `.blog-channel-hero` opening tag and before that section closes, and that the separate top identity bar no longer contains the avatar.

- [x] **Step 2: Run the focused test and verify RED**

Run `node --test tests/blog-channel-hero.test.mjs` with the application server available. Expect the new placement assertion to fail against the current markup.

### Task 2: Move and constrain the profile picture

**Files:**
- Modify: `studio-production-suite/app/blog/channel/[slug]/page.js:23-44`
- Modify: `studio-production-suite/app/globals.css:4831-4935`

- [x] **Step 1: Move the existing conditional avatar markup**

Keep `channel.avatar_url` and its accessible alt text, but render the image as a direct child of `.blog-channel-hero` after the cover image.

- [x] **Step 2: Constrain the square overlay**

Absolutely position `.blog-channel-profile-image` in the upper-left of the hero, preserve `aspect-ratio: 1`, and cap its width below half the hero so its right edge cannot cross the vertical midpoint.

- [x] **Step 3: Preserve mobile behavior**

Use a smaller responsive size and inset at the existing mobile breakpoint without changing the 1:1 shape or left-half constraint.

- [x] **Step 4: Verify GREEN**

Run `node --test tests/blog-channel-hero.test.mjs` and expect every focused test to pass.

### Task 3: Verify and serve

**Files:**
- Modify: `completed_work.md`

- [x] **Step 1: Run the production build**

Run `npm run build` from `studio-production-suite` and expect exit code 0.

- [x] **Step 2: Inspect the final diff**

Confirm only the approved blog channel files, tests, documentation, and work logs changed; preserve the pre-existing `SiteHeader.jsx` edit.

- [x] **Step 3: Record completion**

Add the verified result to `completed_work.md`.

- [x] **Step 4: Start the Node.js server**

Start the project's configured server on port 3000 and verify the blog channel URL responds successfully.
