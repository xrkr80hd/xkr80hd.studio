# Shared Blog Avatar Cropper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one reusable 1:1 crop-and-upload workflow for every blogger's isolated channel avatar.

**Architecture:** A pure geometry module calculates cover scaling and clamped drag offsets. A focused client cropper renders the square canvas and produces a cropped JPEG; the existing shared Blog Profile component sends that file through its current username-scoped upload path.

**Tech Stack:** Next.js 14, React 18, browser Canvas API, CSS, Node test runner

---

### Task 1: Crop geometry

**Files:**
- Create: `studio-production-suite/lib/square-image-crop.mjs`
- Create: `studio-production-suite/tests/square-image-crop.test.mjs`

- [x] Write tests covering landscape and portrait cover scale, zoom multiplication, bounded drag offsets, and square output geometry.
- [x] Run `node --test tests/square-image-crop.test.mjs` and confirm it fails because the geometry module does not exist.
- [x] Implement the pure geometry functions without browser dependencies.
- [x] Rerun the focused test and confirm all geometry cases pass.

### Task 2: Shared crop dialog

**Files:**
- Create: `studio-production-suite/components/BlogAvatarCropper.jsx`
- Modify: `studio-production-suite/components/AdminBlogChannelSettings.jsx`
- Modify: `studio-production-suite/app/globals.css`

- [x] Add a labelled 1:1 canvas dialog with pointer dragging, zoom range, Cancel, and Crop & Upload.
- [x] Open the dialog only for avatar selections and keep cover selections on the current direct upload path.
- [x] Convert the canvas to a square JPEG File and pass it to the existing signed-upload function with target `avatar`.
- [x] Revoke temporary object URLs on cancel, completion, replacement, and unmount.
- [x] Preserve per-user isolation through the existing authenticated channel API and username-scoped storage key.

### Task 3: Verify and serve

**Files:**
- Modify: `planned_work.md`
- Modify: `completed_work.md`

- [x] Run the crop geometry, blog channel, blogger provisioning, admin user, and analytics tests.
- [x] Run `npm run build` and confirm 50/50 static pages generate.
- [x] Inspect the final diff and keep the unrelated pre-existing `SiteHeader.jsx` edit untouched.
- [x] Start the production server on port 3000 and verify the owner and Jessie channel routes return HTTP 200.
