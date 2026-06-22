# Jessie Reusable Blogger Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Jessie a complete isolated blogger lane and reuse the same empty structure whenever a future blogger account is created.

**Architecture:** Use one shared `blog_channels` table with one row per normalized username. Server-side user creation provisions the matching channel row using deterministic default names and slugs; posts remain isolated by `author_username`.

**Tech Stack:** Next.js 14, Node test runner, Supabase Postgres, `@supabase/supabase-js`

---

### Task 1: Channel provisioning helper

**Files:**
- Create: `studio-production-suite/lib/blog-channel-provisioning.js`
- Test: `studio-production-suite/tests/blog-channel-provisioning.test.mjs`

- [ ] Write failing tests for Jessie’s defaults and idempotent provisioning.
- [ ] Implement a helper that upserts one default channel row per username.
- [ ] Return a clear missing-table result when the shared schema is unavailable.

### Task 2: New blogger creation

**Files:**
- Modify: `studio-production-suite/lib/admin-users.js`
- Modify: `studio-production-suite/app/api/admin/users/route.js`
- Test: `studio-production-suite/tests/blog-channel-provisioning.test.mjs`

- [ ] Provision the channel after the account is inserted.
- [ ] Roll back the new account if its required blogger lane cannot be created.
- [ ] Return the provisioned channel in the successful API response.

### Task 3: Shared Supabase schema and Jessie seed

**Files:**
- Create: `studio-production-suite/supabase/migrations/<generated>-create_blog_channels.sql`
- Modify: `studio-production-suite/SUPABASE_SCHEMA_CURRENT.sql`

- [ ] Create `public.blog_channels` once, with unique username and slug indexes.
- [ ] Grant Data API access required by server-side service-role operations and enable RLS.
- [ ] Seed a default row for every existing `admin_users` account, including `jessie_v`.
- [ ] Verify Jessie receives `jessievblog` and a unique public slug.

### Task 4: Verification

- [ ] Query `admin_users`, `blog_channels`, and Jessie’s scoped `blog_posts`.
- [ ] Log in as Jessie and verify `/admin/blog`.
- [ ] Verify Jessie’s public channel.
- [ ] Run Node tests and `npm run build`.
- [ ] Update `planned_work.md` and `completed_work.md`.
