# XSTUDIO private workspace

This app is separate from the main `xrkr80hd.studio` site. Its Vercel root directory is `xstudio-app`, and its production branch is `codex/xstudio-private`.

## Required configuration

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `XSTUDIO_OWNER_USER_ID` for the Fuschia Light House project. The last value must match the sole row in `public.xstudio_owners`. Do not put a Supabase secret or service-role key in Vercel. Optional `GEMINI_API_KEY` and `XAI_API_KEY` enable the owner-only image generation routes.

The app requires a verified Supabase Auth password session for the owner. Anonymous visitors and other Auth users cannot read assets. Asset files use the private `xstudio-assets` bucket; download links expire after 60 seconds.

For an owner who does not know the existing Fuschia Auth password, the login page can request a recovery email for `xrkr80hd@gmail.com`. Add the exact URL `https://xstudio.xrkr80hd.studio/auth/callback` to Fuschia Auth's allowed redirect URLs. Set `XSTUDIO_RECOVERY_COOKIE_SECRET` to a server-only 32-byte random value encoded as base64url; password recovery remains unavailable without it. Open the email link in the same browser used to request it: the Supabase PKCE verifier is stored in that browser's cookies. The callback accepts only a recovery-code exchange, checks the configured owner UID and `xstudio_owners` row, and creates a signed, HttpOnly grant bound to that Auth session for 10 minutes. Only a session with that grant can show `/update-password` or submit a new password. Updating the password clears the grant and signs out the recovery session. This changes that Fuschia Auth account's password; it does not create another user. The recovery flow has no service-role key and does not modify the project's shared email template.

## External asset API

The owner creates a 30-day, read/write token in the app's **Asset API access** panel. Its plaintext is shown once; only its SHA-256 hash is stored. The owner can list and revoke tokens. External tools send `Authorization: Bearer <token>` to `https://osbsjjoxepxezcmupcak.supabase.co/functions/v1/xstudio-assets-api`.

- `POST` multipart form with `file` and optional `name`, `kind`, `project_id` uploads a file up to 4 MiB. The server sets the owner and source provider from the token.
- `GET ?id=<asset UUID>` returns a signed download URL valid for 60 seconds.
- The owner session manages tokens through `GET`, `POST`, and `DELETE` at `/api/integrations/tokens`; these routes forward to the Edge Function using the verified owner JWT.

Larger owner uploads use signed Storage transfer. The app limit is 100 MiB, but the project-wide Supabase Storage limit and large-file reliability still need live verification. Google Flow and Video Express AI have manual source labels because no official API connection or account credential has been verified. Gemini and xAI adapters are present but disabled without their server-side keys.

## Database migration history

The four XSTUDIO migration files were applied to Fuschia through the connected SQL tool. That path did not record them in Supabase's migration ledger. Do not run `supabase db push` against Fuschia until an account with project CLI access repairs the ledger to reflect these already-applied migrations. Do not replay the files against the live database.

## Local verification

Run `pnpm install --frozen-lockfile`, `pnpm run build`, and `node --test tests/*.test.mjs` from this directory. The checked-in `.env.example` lists the required names without credentials.

## Vercel build settings

Use `xstudio-app` as the Root Directory and the Next.js framework preset. This directory’s `vercel.json` runs `npx --yes pnpm@11.25.0 install --frozen-lockfile` and `npx --yes pnpm@11.25.0 run build`; leave Output Directory at the Next.js default. There is no npm workspace at the repository root. Do not use `npm run build --workspace=xstudio-app`.

Deploy a commit containing this configuration. Commit `20b636c` contains the obsolete root-level npm workspace commands; redeploying that commit can keep using those commands instead of the corrected configuration.

Vercel commands explicitly select pnpm 11.25.0 because Corepack detection can fail when the repository root has no package.json. Do not replace these with an unversioned pnpm command: an older global pnpm cannot read this app’s lockfile.

Cloud SQL availability does not authenticate an owner. Production login and owner-only APIs require the configured Supabase user and matching xstudio_owners record; unsigned fallback cookies never grant access.
