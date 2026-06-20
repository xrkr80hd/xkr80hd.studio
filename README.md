# xrkr80hd.studio

Starter repository for the xrkr80hd.studio Laravel project. This repo contains the application source used for the site and local development tooling.

## Overview

- Laravel app in `studio-production-suite/`
- Public web assets served from `public/`

## Quick start (local)

1. Copy environment and install PHP dependencies

```bash
cp studio-production-suite/.env.example studio-production-suite/.env
cd studio-production-suite
composer install --no-interaction --prefer-dist
php artisan key:generate
```

1. Install JS dependencies and build assets

```bash
npm ci
npm run dev   # or `npm run build` for production
```

1. Run database migrations (if applicable)

```bash
php artisan migrate
```

1. Start the local server

```bash
php artisan serve
# or use Sail / Docker if configured with the project
```

## Notes

- This repository was initialized with standard Laravel `.gitignore` and an MIT license.
- If you want me to push this repo to GitHub, tell me the owner/repo name or allow me to create it via the `gh` CLI.

## Hard Responsive Rules (Do Not Break)

- Mobile-first is mandatory. Any UI update must be tested for small screens before merge.
- Cards and list items must stay compact on mobile. Do not let images expand card height unexpectedly.
- Always define explicit mobile constraints for media (`width`, `height`, `min-height`, and `max-height`) in breakpoints.
- When desktop and mobile differ, mobile must prioritize readability, compact density, and predictable spacing.
- Do not ship layout changes that increase mobile card height without explicit approval.
- For reactive/responsive components, verify behavior at common phone widths (320px, 375px, 390px, 430px) before pushing.
