# Changelog

## 2026-09-11

- Added an authenticated Supabase Edge Function backend for AI Coach and 360° Street View capture on the deployed app.
- Added custom 1–100-round games, per-mode performance statistics, and navigation-connected panorama checks for movable games.
- Separated Review from Statistics, folded location/history views into Statistics, and made saved game sessions open their summaries.
- Expanded review-card maturity into New, Learning, Relearning, Young, and Mature states with long-term mastery ranks.
- Fixed narrow guess-button wrapping and independently anchored the AI Coach and guess map without either panel pushing the other.
- Made the AI Coach and guess map draggable within the viewport, and stopped restored Study panoramas from counting as new encounters.
- Centered a high-contrast round clock over Street View: elapsed time counts up for unlimited rounds, while timed rounds count down with a clear urgent state.
- Added a cloud-synced compass-style preference with a compact heading bar inspired by the gameplay reference and the existing dial as an alternative.
- Split Preferences into persistent Language, Review, and Display tabs.
- Improved Coach-analysis bullets and added a full saved-clue detail view for every stored analysis field.
- Restored elapsed/countdown clocks and the active Street View panorama, camera angle, and zoom after reloads.
- Localized remaining Statistics labels and Street View, location, collection, result, summary, and cloud-account UI copy across all supported languages.
- Made every Geography statistics table column sortable and localized its headers, labels, and sample statuses across all supported languages.
- Retired redundant bookmark and coordinate-copy controls while preserving existing saved bookmark data for compatibility.
- Clarified Street View Static API key-restriction failures and kept long table headings visible while scrolling.
- Reworked coverage-map hover labels to remove clipped Google popup chrome and nested scrolling.
- Added a persisted opt-in AI-assisted Play filter to Statistics, surfaced the assisted-round count, and marked assisted attempts in History.

- Replaced the floating AI Coach launcher with a compact map icon, added a Play setup toggle, and kept model names out of the UI.
- Improved AI Coach evidence quality, confidence calibration, contradiction handling, 360° analysis, and GeoGuessr hint retrieval.
- Auto-save coaching notes and analyzed clue screenshots; saved clue images remain removable and cloud-synced.
- Added separate UI, game, and AI language preferences for English, Spanish, Portuguese, French, German, Italian, Russian, and Swedish.
- Added Anki-style review statistics, due scheduling, daily limits, strictness presets, relearning controls, and configurable review order.
- Added first-Play scheduling and post-game mistake practice that repeats weak answers until corrected.
- Kept custom practice independent from spaced-repetition due dates.
- Fixed multi-location review queues, simplified review completion, centered navigation, and removed redundant manual backup UI.
- Quieted cloud sync by coalescing rapid local saves, and stopped Vite from restarting for server-only edits.
- Persisted language, scheduling, game setup, map-aid, Study-filter, and active-review preferences in the cloud-backed settings store.
- Restored the active Study panorama, unfinished Play round, Review queue, Training Log tabs, Statistics section, and Coach panel after reloads.
- Rebound restored Play panoramas through canonical Street View lookup after Maps initialization, with a durable loader configuration guard for HMR.
- Ignored empty hot-reload session records so Statistics no longer counts reload noise as learning sessions.
- Added a prominent daily Review action, localized completion/next-due states, and configurable timezone/reset boundaries with migration-safe defaults.
- Replaced screen-sharing capture with automatic server-side Street View capture and bounded capture timeouts.
