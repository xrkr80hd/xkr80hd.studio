# Public Listing Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the established Blog listing intact while giving the owner-managed public category listings one full-width horizontal card system with 1:1 art, podcast descriptions, and sortable business entries.

**Architecture:** Existing server-rendered listing pages opt into shared public-listing CSS classes while preserving their current data sources and links. Business sorting and filtering live in a small pure helper consumed by the server page through query parameters.

**Tech Stack:** Next.js 14 App Router, React Server Components, CSS, Node test runner.

---

### Task 1: Lock the shared listing contract

**Files:**
- Create: `studio-production-suite/tests/public-listing-cards.test.mjs`
- Create: `studio-production-suite/tests/business-listing.test.mjs`

- [ ] Add failing source-contract tests for horizontal cards, title placement, and 16:9/1:1 media.
- [ ] Add failing podcast description coverage.
- [ ] Add failing behavior tests for A-Z, Z-A, category ordering/filtering, category extraction, and non-mutation.
- [ ] Run both tests and confirm they fail for the missing implementation.

### Task 2: Implement business directory ordering

**Files:**
- Create: `studio-production-suite/lib/business-listing.mjs`
- Modify: `studio-production-suite/app/your-local-business/page.js`

- [ ] Implement pure category extraction, filtering, and sorting.
- [ ] Add accessible GET controls for A-Z, Z-A, category order, and category filtering.
- [ ] Move the 1:1 logo into the shared media region.
- [ ] Run the business behavior tests and confirm they pass.

### Task 3: Apply shared public listing cards without changing Blog

**Files:**
- Modify: `studio-production-suite/app/blog/page.js`
- Modify: `studio-production-suite/components/BandGridPage.jsx`
- Modify: `studio-production-suite/app/your-local-artists/page.js`
- Modify: `studio-production-suite/app/podcast/page.js`
- Modify: `studio-production-suite/app/globals.css`

- [ ] Preserve the existing Blog listing markup and dedicated 16:9 styling.
- [ ] Apply square-card classes to Legends, Scene, Artists, and Podcasts.
- [ ] Put each title first in its content region and include podcast description copy.
- [ ] Add bounded desktop/mobile horizontal styles and clamped content.
- [ ] Run listing tests and confirm they pass.

### Task 4: Verify and publish

**Files:**
- Modify: `planned_work.md`
- Modify: `completed_work.md`

- [ ] Run all relevant Node tests.
- [ ] Run `npm run build` and confirm all pages compile.
- [ ] Inspect the final diff and run `git diff --check`.
- [ ] Commit all requested changes and push directly to `origin/main`.
