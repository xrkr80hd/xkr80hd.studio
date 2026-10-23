# Dynamic API Resolver & Vercel Build Pipeline Plan

Comprehensive architectural blueprint to refactor all API client fetch calls and asset URL resolvers to use dynamic environment-aware base URLs, enforce runtime Supabase validation with graceful Cloud SQL fallback, and optimize the Next.js build pipeline for Vercel deployment targeting `xstudio.xrkr80hd.studio`.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed based on user feedback:
> - **API URL Resolution**: Dynamic environment-aware resolution prioritizing `NEXT_PUBLIC_API_URL` when provided, gracefully falling back to standard origin-relative paths and `window.location.origin` in the browser for `xstudio.xrkr80hd.studio`.
> - **Supabase & Cloud SQL Binding**: Runtime validation of Supabase configuration (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `XSTUDIO_OWNER_USER_ID`) with an automatic, graceful fallback to the provisioned Cloud SQL PostgreSQL database.
> - **Deployment Target**: Optimization for a standalone Next.js production build (`xstudio-app`) tailored for Vercel and containerized environments.

---

## 1. Overview & Core Concept

- **What It Does**: Unifies all client-side network communication into a centralized, resilient API resolver (`resolveApiUrl`) and fetch wrapper (`studioFetch`). All component actions—project loading, asset triage, file uploads, backups, story updates, and image asset links—automatically adapt to the current domain (`xstudio.xrkr80hd.studio`, custom staging domains, or local development) without hardcoded origins.
- **Target Audience**: Production users and operators of XSTUDIO Cinematic Engine accessing the studio at `xstudio.xrkr80hd.studio` and deployed via Vercel.
- **Key Value**: Prevents 403 Forbidden origin errors and CORS misconfigurations across staging, preview, and custom domains while providing high-reliability persistence via Supabase with automatic Cloud SQL fallback.

---

## 2. User Experience & Visual Design

- **Domain Language**: Aligned with the SaaS & Studio Production Suite constitution (`references/3_saas_dashboard.md`), maintaining a dark slate cinematic workspace (`#0F172A`), high-density data tables, and tabular typography (`tabular-nums`).
- **Connection & State Transparency**:
  - *Network Failures / Connection Loss*: Clean, human error states ("Connection unavailable. Your local workspace is preserved.") without cryptic stack traces or mechanical error alerts.
  - *Asset Loading*: Unbroken image preview grids with resilient fallback containers and correct content-type streaming headers.
  - *Action States*: Button loading spinners, clear disabled states during file uploads, and atomic recovery on network timeouts.
- **Zero-Pill Discipline & Typography**: Unboxed status labels with typographic separators (`·`), crisp display hierarchy with Plus Jakarta Sans / DM Sans, and monospace tabular figures for revision numbers and asset IDs.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Centralized Resolver vs. Inline Replacements
- **Chosen Approach**: Introduce a dedicated, isomorphic helper module `lib/xstudio-api.ts` (and `.mjs`) exporting `resolveApiUrl(path)` and `studioFetch(path, init)`.
- **Why**: Eliminates copy-paste bugs, ensures single-point maintenance of environment logic, and automatically attaches necessary security headers and `credentials: 'same-origin'`.
- **Alternatives Considered**: Inlining `process.env.NEXT_PUBLIC_API_URL || ''` in 40+ component files was rejected because it introduces repetitive boilerplate and makes future domain routing changes fragile.

### Decision 2: Hybrid Database Binding Strategy
- **Chosen Approach**: Dual-mode data tier that inspects Supabase environment credentials at runtime. If present and valid, Supabase is engaged; if unset or unreachable, the system seamlessly transitions to Cloud SQL PostgreSQL with binary file tables.
- **Why**: Allows seamless Vercel deployment where either Supabase credentials or Cloud SQL connection variables can be supplied without breaking build-time static checks.
- **Alternatives Considered**: Hard failure at build time when Supabase keys are missing was rejected per user direction to allow graceful fallback.

### Decision 3: Standalone Build Pipeline for Vercel
- **Chosen Approach**: Standardize `xstudio-app` with standalone output configuration (`output: 'standalone'` in Next.js config) and add a root `vercel.json` pointing to `xstudio-app`.
- **Why**: Guarantees minimal bundle size, fast cold starts on Vercel Serverless Functions, and reproducible local vs. cloud builds.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        XSTUDIO Browser Client                          │
│                     (xstudio.xrkr80hd.studio)                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │         resolveApiUrl(endpoint)           │
             │  1. NEXT_PUBLIC_API_URL (if defined)      │
             │  2. window.location.origin (browser fallback)│
             │  3. Origin-relative '/api/...'            │
             └─────────────────────┬─────────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       studioFetch(endpoint, init)         │
             │  - Attaches Same-Origin Credentials       │
             │  - Dynamic Origin & Base Header Handling  │
             └─────────────────────┬─────────────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐
       │   Vercel / Next.js    │       │   Preview Container   │
       │     API Handlers      │       │      (Port 3000)      │
       │  (/api/projects, etc) │       │                       │
       └───────────┬───────────┘       └───────────┬───────────┘
                   │                               │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       Runtime Persistence Selector        │
             │                                           │
             │  [Supabase Config Valid?]                 │
             │       ├── YES ──► Supabase Client         │
             │       └── NO  ──► Cloud SQL (PostgreSQL)  │
             └───────────────────────────────────────────┘
```

### Component & File Implementation Blueprint

1. **API Client & Resolver (`xstudio-app/lib/xstudio-api.ts`)**:
   - `resolveApiUrl(path: string): string`: Computes absolute or origin-relative URLs based on `NEXT_PUBLIC_API_URL` and `window.location`.
   - `studioFetch(input: string, init?: RequestInit): Promise<Response>`: Thin fetch wrapper injecting credentials and base resolution.
   - `resolveAssetUrl(project: string, fileId: string): string`: Resolves dynamic image and cover URLs.

2. **Client Components Refactor**:
   - `CinematicStudio.tsx`: Update all project manifest, upload, triage, and restore calls to use `resolveApiUrl` / `studioFetch`.
   - `BulkTriagePanel.tsx`: Refactor bulk triage and classification endpoints.
   - `AssetDetails.tsx` & `AssetForm.tsx`: Refactor asset detail updates and thumbnail URL builders.
   - `CharacterForm.tsx`: Refactor character avatar previews and save routes.
   - `StudioDashboard.jsx`: Update asset library loading, uploads, downloads, and workflow status mutations.
   - `CoverAssetPicker.tsx` & `AssetViewerModal.tsx`: Update cover assignment and full-screen viewer endpoints.

3. **Supabase & Backend Verification**:
   - `xstudio-server.js`: Ensure `configurationReady()` checks for valid Supabase URL, publishable key, and owner UUID; gracefully route to Cloud SQL when unconfigured.
   - `xstudio-sql.mjs`: Maintain high-performance PostgreSQL connection pool for projects, manifests, and binary file storage.
   - `xstudio-validation.mjs`: Ensure `isTrustedOrigin` accepts `xstudio.xrkr80hd.studio`, `xrkrstudio.xrkr80hd.studio`, Vercel deployment URLs, and local origins.

4. **Vercel Build Pipeline Configuration**:
   - `xstudio-app/next.config.mjs`: Configure standalone output and production asset headers.
   - Root `vercel.json`: Configure root directory routing to `xstudio-app`.
   - Build validation: Verify `npm run build` passes Turbopack compilation and TypeScript verification without errors.
