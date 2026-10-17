# XSTUDIO private workspace

This app is separate from the main `xrkr80hd.studio` site. Its Vercel root directory is `xstudio-app`, and its production branch is `codex/xstudio-private`.

## Required configuration

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `XSTUDIO_OWNER_USER_ID` for the Fuschia Light House project. The last value must match the sole row in `public.xstudio_owners`. Do not put a Supabase secret or service-role key in Vercel. Optional `GEMINI_API_KEY` and `XAI_API_KEY` enable the owner-only image generation routes.

The app requires a verified Supabase Auth password session for the owner. Anonymous visitors and other Auth users cannot read assets. Asset files use the private `xstudio-assets` bucket; download links expire after 60 seconds.

## External asset API

The owner creates a 30-day, read/write token in the app's **Asset API access** panel. Its plaintext is shown once; only its SHA-256 hash is stored. The owner can list and revoke tokens. External tools send `Authorization: Bearer <token>` to `https://osbsjjoxepxezcmupcak.supabase.co/functions/v1/xstudio-assets-api`.

- `POST` multipart form with `file` and optional `name`, `kind`, `project_id` uploads a file up to 4 MiB. The server sets the owner and source provider from the token.
- `GET ?id=<asset UUID>` returns a signed download URL valid for 60 seconds.
- The owner session manages tokens through `GET`, `POST`, and `DELETE` at `/api/integrations/tokens`; these routes forward to the Edge Function using the verified owner JWT.

Larger owner uploads use signed Storage transfer. The app limit is 100 MiB, but the project-wide Supabase Storage limit and large-file reliability still need live verification. Google Flow and Video Express AI have manual source labels because no official API connection or account credential has been verified. Gemini and xAI adapters are present but disabled without their server-side keys.

## Database migration history

The four XSTUDIO migration files were applied to Fuschia through the connected SQL tool. That path did not record them in Supabase's migration ledger. Do not run `supabase db push` against Fuschia until an account with project CLI access repairs the ledger to reflect these already-applied migrations. Do not replay the files against the live database.

## Local verification

Run `npm ci`, `npm run build`, and `node --test tests/*.test.mjs` from this directory. The checked-in `.env.example` lists the required names without credentials.
