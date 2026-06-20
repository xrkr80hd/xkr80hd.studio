# Google Analytics Visitor Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GA4 page-view tracking for public routes while excluding the admin area.

**Architecture:** A small route-policy helper decides whether analytics may run. A client component loads `gtag.js`, configures it with automatic page views disabled, and sends explicit page views as Next.js navigation changes. The root layout mounts the component once.

**Tech Stack:** Next.js 14 App Router, React 18, `next/script`, Node's built-in test runner

---

### Task 1: Route Tracking Policy

**Files:**
- Create: `studio-production-suite/lib/google-analytics.mjs`
- Test: `studio-production-suite/tests/google-analytics.test.mjs`

- [x] Write tests proving public routes are tracked and `/admin` routes are excluded.
- [x] Run `node --test tests/google-analytics.test.mjs` and confirm it fails because the helper does not exist.
- [x] Implement `shouldTrackGoogleAnalytics`.
- [x] Run the test again and confirm it passes.

### Task 2: GA4 Component

**Files:**
- Create: `studio-production-suite/components/GoogleAnalytics.jsx`
- Modify: `studio-production-suite/app/layout.js`

- [x] Add a client component using measurement ID `G-3ZHD6MN490`.
- [x] Load `gtag.js` only when the current route passes the tracking policy.
- [x] Configure GA4 with `send_page_view: false`.
- [x] Send explicit `page_view` events for public path and query-string changes.
- [x] Mount the component once in the root layout.

### Task 3: Verification and LICL Completion

**Files:**
- Modify: `planned_work.md`
- Modify: `completed_work.md`

- [x] Run the analytics unit test.
- [x] Run `npm run build`.
- [ ] Inspect the diff and stage only analytics and agent-system records.
- [x] Record verification in `completed_work.md`.
