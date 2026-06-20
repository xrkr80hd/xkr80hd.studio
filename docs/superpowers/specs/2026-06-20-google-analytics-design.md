# Google Analytics Visitor Tracking Design

## Goal

Add standard GA4 visitor tracking using measurement ID `G-3ZHD6MN490`, while excluding all `/admin` routes.

## Design

- Mount one client-side analytics component from the shared root layout.
- Load Google's `gtag.js` only on non-admin routes.
- Disable Google's automatic page view so the app can explicitly record Next.js route changes without recording admin navigation.
- Send a `page_view` event after the Google script is ready and whenever the public pathname or query string changes.
- Keep future dealership inventory webhooks and lead-event tracking outside this change.

## Verification

- Unit-test which routes are eligible for tracking.
- Run the production Next.js build.
- Inspect the final diff to ensure unrelated local work is not included.
