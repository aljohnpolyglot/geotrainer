# GeoTrainer authentication setup

## Branded confirmation email

In the hosted Supabase dashboard, open **Authentication → Email Templates → Confirm sign up**.

- Subject: `Confirm your GeoTrainer account`
- Body: paste the contents of `confirmation.html`

The template removes Supabase branding from the message body. To replace Supabase in the sender line too, configure **Authentication → SMTP Settings** with your mail provider and set the sender name to `GeoTrainer`. Keep SMTP credentials only in Supabase, never in this repository or a `VITE_` variable.

## Google sign-in

1. In Google Auth Platform, create a **Web application** OAuth client.
2. Add `http://localhost:3000` as an authorized JavaScript origin.
3. Add the callback URL shown on Supabase's **Authentication → Sign In / Providers → Google** page as an authorized redirect URI in Google.
4. Paste the Google client ID and secret into that Supabase provider page and enable Google.
5. In Supabase **Authentication → URL Configuration**, set the Site URL and redirect allow list to `http://localhost:3000` while developing. Add the deployed URL before production use.

The Google client secret belongs only in Supabase. GeoTrainer requests identity scopes only; it does not request Drive, Maps, or other Google account data.
