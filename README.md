# GeoTrainer — Street View Trainer

A private, browser-local Street View study, play, and spaced-review trainer built with React, TypeScript, and Vite.

Country bounds and city seeds are generation hints, not claims of exhaustive Street View coverage. City coverage and regional city pools are derived from the CC BY 4.0 [GeoNames](https://www.geonames.org/) `cities15000`, `admin1CodesASCII`, and `countryInfo` data; continent/subregion labels use the REST Countries open dataset plus documented learning-region overrides for Baltics, Nordics, Central Europe, Balkans, Caucasus, and the Middle East.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `VITE_GOOGLE_MAPS_API_KEY`.
3. Optional cloud sync: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project's **Connect** dialog.
4. Run `npm run dev` and open <http://localhost:3000>.

For cloud backup, create a Supabase project and run [`supabase/migrations/001_user_backups.sql`](supabase/migrations/001_user_backups.sql) in its SQL Editor. To enable private Notebook and Coach clue-image sync, also run [`supabase/migrations/002_clue_images.sql`](supabase/migrations/002_clue_images.sql). If the Data API reports that `user_backups` is not exposed, add the `public` schema/table to the project's Data API exposed schemas, then copy the project URL and **publishable** key from **Connect** into `.env`. Never use a Supabase secret or `service_role` key in a `VITE_` variable.

Google sign-in requires enabling **Authentication → Providers → Google** in Supabase with a Google Web OAuth client. Use the callback URL shown on that provider page and allow `http://localhost:3000` during development. For branded confirmation mail, paste [`supabase/templates/confirmation.html`](supabase/templates/confirmation.html) into **Authentication → Email Templates → Confirm signup** and set the subject to `Confirm your GeoTrainer account`.

The Google Cloud key must have **Maps JavaScript API** and **Street View Static API** enabled. AI Coach captures the current panorama automatically; Analyze 360° sends four transient quarter-turn views without opening a screen-sharing picker. Restrict keys to local/deployed origins; never commit `.env`. Reverse geocoding uses the geocoder supplied by Maps JavaScript API.

## Checks

- `npm test` — IndexedDB migration, review, and backup safety checks.
- `npm run lint` — TypeScript validation.
- `npm run build` — production Vite build.

Progress is stored in the browser's `street-view-trainer` IndexedDB database and quietly backed up after changes when a cloud account is connected.
