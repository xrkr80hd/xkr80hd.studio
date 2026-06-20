# Admin User Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Manage Admin Users page with compact cards, user creation, and role-grouped scoped users.

**Architecture:** Keep the existing secure `admin_users` login table. A small pure helper describes the current access model: the owner is a full admin and database-managed accounts are blog users. The client manager renders owner and scoped accounts separately and reuses one compact user-card component for account actions.

**Tech Stack:** Next.js 14 App Router, React 18, Supabase server client, Node test runner

---

### Task 1: Account Grouping Policy

**Files:**
- Create: `studio-production-suite/lib/admin-user-groups.mjs`
- Create: `studio-production-suite/tests/admin-user-groups.test.mjs`

- [x] Write tests that place the owner in the admin group and database accounts in the Blogs category.
- [x] Run `node --test tests/admin-user-groups.test.mjs` and confirm it fails because the helper is absent.
- [x] Implement the grouping helper and category metadata.
- [x] Run the test again and confirm it passes.

### Task 2: User Manager Layout and Behavior

**Files:**
- Modify: `studio-production-suite/components/AdminUsersManager.jsx`
- Modify: `studio-production-suite/app/admin/users/page.js`

- [x] Rename the creation section to **Add User** and include the **Blogs** access category.
- [x] Render the owner under **Existing Admin Users**.
- [x] Render database and secure environment users under **Existing Users → Blogs**.
- [x] Preserve create, password reset, login-copy, and delete behavior for database-managed users.
- [x] Move secondary controls into per-user accordions.

### Task 3: Compact Styling

**Files:**
- Modify: `studio-production-suite/app/globals.css`

- [x] Add page-scoped user-manager layout styles.
- [x] Reduce card padding and form spacing.
- [x] Keep controls readable and responsive on mobile.

### Task 4: LICL Verification

**Files:**
- Modify: `planned_work.md`
- Modify: `completed_work.md`

- [x] Run grouping-policy tests.
- [x] Run the existing analytics test.
- [x] Run `npm run build`.
- [x] Inspect the final diff and preserve unrelated changes.
- [x] Record verified completion in the LICL logs.
