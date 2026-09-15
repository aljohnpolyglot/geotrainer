# Product TODO

## Learn modes

Split Learn into two explicit modes while preserving the current workflow and saved data.

### Custom learning

- Keep the current Learn experience as **Custom**.
- The learner chooses collections, country mixes, environment, and sampling options.
- Existing Study bookmarks, Review sources, coverage, and history remain compatible.

### Meta learning

Build a guided active-recall loop using custom Meta Learning maps curated by this project. Each map location is explicitly linked to a prepared meta card:

1. Show a Street View location without revealing the answer or target meta.
2. Let the learner place an initial map guess.
3. After submission, open the location's linked meta card in a panel styled like AI Coach.
4. Let the learner read the card, inspect the same location, and guess again.
5. After the second submission, show the meta card again with the first-versus-second comparison.
6. If the second guess is still beyond the configured distance threshold, automatically create one new Review card for that location and meta.
7. Continue to the next curated location.

### Invariants

- The first guess must not receive answer metadata or a spoiler from AI Coach.
- Meta Learning locations and cards come from project-owned custom map data, not generated random locations.
- Every submitted guess opens the linked meta card; the card must describe something genuinely visible in that panorama.
- The second guess creates a new attempt; it must not overwrite the first attempt.
- Create at most one reusable Review source card for the location/meta pair.
- Review scheduling remains automatic and score/distance-derived.
- Do not persist Street View imagery unless the learner explicitly saves a clue image.
- Define and test the “still far off” threshold during implementation; keep it independent from ordinary Play scoring.

### Acceptance checks

- Switching between Custom and Meta Learning preserves each mode’s draft settings.
- Reloading during either guess restores the same panorama and stage.
- Submitting either guess opens the correct curated meta card in a Coach-style panel.
- A close second guess advances without creating a Review card.
- A far second guess creates exactly one Review card and then advances.
- Replaying the same location never duplicates its reusable source card.
- The complete flow works in all supported interface, game, and AI languages.

## Notebook and clue recovery — urgent

Do not ask the learner to create more clues until this section is complete. Preserve multiple independent clues and notes from the same panorama; never collapse them into one record.

### Frozen evidence

- Keep `C:\Users\user-MSI\Downloads\GeoTrainer-Recovery-2026-09-15` unchanged as the recovery archive.
- The latest browser snapshot is in `current-browser-snapshot` and was taken from both the production and localhost IndexedDB databases.
- The current browser snapshot contains **79 recoverable Notebook records** and **294 decodable clue-image records**.
- The last verified cloud backup contains **69 Notebook records** and **289 clue records**. Merge the browser snapshot into that newer cloud state; never replace either side wholesale.
- The user supplied their external Gemini conversation history in this thread. Use it as source evidence for the missing recent descriptions, including the Russia/Jordan/UAE/Qatar/India/Kazakhstan/Turkey and Southeast Asia sequence. Do not call Gemini to rewrite the user's notes.
- Preserve exact user text when it exists. Clearly label any reconstruction when only screenshots or conversation history survive.

### Broken image links

Nine recovered Notebook notes reference clue IDs absent from both the cloud clue list and private Supabase Storage:

- Turkey — `clue-8cb8ad8c-11e8-440d-8908-1be96048d8a5`
- Kazakhstan — `clue-b64d913c-a321-4011-94a7-e6db91ed34a9`
- Nepal — `clue-905c4ba5-78a8-4f50-8c15-36eb8050be59`
- Oman — `clue-252a9dbe-7719-4169-a912-d4eeb2731420`
- Indonesia — `clue-718c8b33-b770-4e5e-8ab2-1c140f065677`
- Taiwan — `clue-215c326f-f1ac-4252-a05a-4aacb4bf45f2`
- Israel — `clue-4adb4e99-95bd-4385-9896-827daacc8257`
- Israel — `clue-28e271a1-d008-4d18-a319-763adbe306c9`
- Luxembourg — `clue-cb102bfb-4dc4-4fdc-a029-703bb797d15b`

The storage audit reported `broken_links: 9`, `images_already_in_private_storage: 0`. Six matching panorama screenshots were recovered into `matched-location-candidates`, but contributor rules forbid silently substituting a general panorama preview for the submitted clue crop. Use vision to confirm an exact foreground match or leave the older record valid as text-only.

These nine are only the currently proven broken references, not the total missing work. The user reports creating many separate clues on one unchanged panorama by looking/panning around without walking; several later disappeared. Audit every historical Notebook settings snapshot, clue-store put/tombstone, scoped clue draft, screenshot blob, and supplied external-history entry for repeated saves sharing the same `panoId`. Preserve every unique save ID, timestamp, description, and submitted view.

Additional reproducible evidence: Available notes showed three same-panorama Personal saves at `2026-09-15 19:31:42`, `19:31:51`, and `19:31:57`. The newest `19:31:57` note was explicitly saved with a photo, but its expected photo link disappeared. The user intentionally supplied black images for this test, so all-black pixels are valid content and must never be rejected. Detect failure from the missing referenced clue/image record, not from image appearance.

### Missing Taiwan sequence

Recover three separate notes from the user's supplied Gemini history and screenshots for panorama `X_071iM9I7BoueJLjhSkqQ`:

- motorcycle two-stage/hook-turn sign;
- pedestrian-path sign;
- yellow/black curbs plus triple-bamboo tree stakes.

Only the third description currently survives in IndexedDB. The screenshot shows the pedestrian note at `2026-09-15 18:59:27` and the curb/bamboo note at `2026-09-15 18:58:48`. Keep all three as independent records and attach only their own matching submitted/cropped image.

### Prevention fix deployed and verified

Commit `07df84b` is deployed and:

- changes background cloud imports from destructive `replace` to non-clearing `merge`, preventing a save completed during synchronization from being erased;
- renders Notebook, Personal clue, and Coach Markdown through `CoachRichText` in My Clues;
- removes dangling standalone `-` paste markers;
- keeps broken photo-linked notes visible with a localized recovery warning instead of attaching another clue image;
- adds focused regression checks for same-panorama first/later images and all-black image data.

`npm run lint`, all 114 tests, the production build, the Impeccable detector, GitHub Pages deployment, and the served production bundle passed. Automated browser screenshots remain pending because no browser connection was available in the verification session.

### Recovery status — 2026-09-16

- A newer frozen snapshot recovered 85 Notebook records and 298 clue records. After removing one duplicate recovered draft and adding the two missing Taiwan descriptions from the supplied evidence, the recovery package contains 86 notes.
- The package was merged with the latest remote backup. The verified cloud result contains **89 Notebook notes and 298 clue records**.
- All **298/298** surviving clue image paths were verified in private Storage; no hosted object is missing.
- **11** Notebook notes still reference submitted images absent from every frozen IndexedDB snapshot and private Storage. Their text remains intact and the deployed UI marks them for recovery. Do not claim those 11 images were recovered.
- The final backup and verification report are frozen in `C:\Users\user-MSI\Downloads\GeoTrainer-Recovery-2026-09-15`.

### Recovery completion

- [x] Merge the recovered Notebook and clue records plus evidence-backed Taiwan descriptions into the latest cloud backup.
- [x] Verify every surviving submitted clue image path in private per-user Supabase Storage.
- [x] Preserve unresolved photo-linked notes and mark them as recovery errors instead of substituting another image.
- [x] Detect missing clue records, unresolved hosted paths, and browser image-load failures while leaving genuine text-only notes unaffected.
- [x] Show the broken-photo count in My Clues and retry exact-image recovery from the panorama-scoped draft and private Storage object. The frozen backup was audited separately; panorama screenshots are never substituted.
- [x] Log a development-only `console.error` whenever clue or Notebook counts fall outside an explicit delete or validated replacement, with counts, operation, host, and anonymous session/device IDs only.
- [x] Trace the first-image failure: clue persistence correctly precedes Notebook persistence and draft clearing; the destructive background cloud replacement between those writes was the deletion point. Background imports now merge, and the first/later same-panorama regression locks that ordering.
- [x] Verify My Clues sorts the combined filtered timeline before pagination, renders Markdown, shows exact timestamps, and keeps source metadata below the body.
- [x] Verify Available notes refreshes after local saves and mounted cloud imports, retains nearby nodes across walking, and receives merged localhost/production records after focus sync.
- [x] Cover several same-panorama photo/text saves across an interleaved cloud merge; unique note and clue IDs survive in newest-first creation order without movement.
- [x] Cover an intentionally all-black first image through merge/reload data paths; pixels are never used as a validity test.
- [x] Cover a new panorama's first and later clues as independent IDs, images, descriptions, timestamps, and linked notes after synchronization.
- [x] Save before/after cloud backups and report exact final counts. Do not claim full image recovery unless every surviving image is verified.
