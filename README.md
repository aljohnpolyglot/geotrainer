# GeoTrainer — Street View Trainer

A private, browser-local Street View study, play, and spaced-review trainer built with React, TypeScript, and Vite.

Country bounds and city seeds are generation hints, not claims of exhaustive Street View coverage. City coverage is derived from GeoNames `cities15000` and `countryInfo`; continent/subregion labels use the REST Countries open dataset plus documented learning-region overrides for Baltics, Nordics, Central Europe, Balkans, Caucasus, and the Middle East.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `VITE_GOOGLE_MAPS_API_KEY`.
3. Optional cloud sync: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project's **Connect** dialog.
4. Run `npm run dev` and open <http://localhost:3000>.

For cloud backup, create a Supabase project, run [`supabase/migrations/001_user_backups.sql`](supabase/migrations/001_user_backups.sql) in its SQL Editor, then copy the project URL and **publishable** key from **Connect** into `.env`. Never use a Supabase secret or `service_role` key in a `VITE_` variable.

The Google Cloud browser key must have **Maps JavaScript API** enabled. Automatic AI Coach frames also use **Street View Static API** when available, with native one-frame screen capture as a fallback. Restrict keys to local/deployed origins; never commit `.env`. Reverse geocoding uses the geocoder supplied by Maps JavaScript API.

## Checks

- `npm test` — IndexedDB migration, review, and backup safety checks.
- `npm run lint` — TypeScript validation.
- `npm run build` — production Vite build.

Progress is stored in the browser's `street-view-trainer` IndexedDB database. Use **Review → Data → Export progress** for portable backups.
