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

### Prevention fix already drafted but not verified

There are uncommitted changes that:

- change background cloud imports from destructive `replace` to non-clearing `merge`, preventing a save completed during synchronization from being erased;
- render Notebook, Personal clue, and Coach Markdown through `CoachRichText` in My Clues;
- remove dangling standalone `-` paste markers;
- add focused regression checks and changelog entries.

Review the diff, then run `npm run lint`, `npm test`, and `npm run build`. Browser-check My Clues and Available notes in desktop/mobile and light/dark modes, run the Impeccable detector on changed UI files, then commit, push, wait for GitHub Pages deployment, and verify the deployed bundle.

### Recovery completion

- Merge all 79 recovered Notebook records, all 294 decoded image records, and any additional exact records reconstructed from the supplied history into the latest cloud backup.
- Re-upload every recovered submitted clue image to private per-user Supabase Storage and store its deterministic `imagePath`.
- Verify that every Notebook `clueId` resolves to its own image record or is explicitly retained as a valid text-only legacy note.
- Detect broken references automatically: when a Notebook note has a `clueId` but its clue record, hosted image path, or signed image cannot be resolved, mark it as a data-integrity error such as **Photo missing — recovery needed** instead of silently showing the ordinary text-only placeholder. Keep genuinely text-only notes unaffected.
- Surface the detected broken-reference count in the recovery/audit UI and try safe repair from the local clue record, scoped draft, private Storage object, and frozen backup before asking the learner to act.
- Add a development-only `console.error` invariant when the persisted clue or Notebook-note count decreases without an explicit user deletion or validated backup replacement. Log only previous/current counts, operation type, host, and anonymous session/device identifiers—never note text, images, locations, account data, tokens, or secrets.
- Investigate the user's pattern that the **first image clue saved on each newly opened panorama** disappears while later same-panorama clues may survive. Trace first-save ordering across clue persistence, Notebook-history persistence, draft clearing, Review scheduling, cloud upload, focus pull, and mounted Available-notes refresh.
- Verify My Clues is globally chronological after filters, renders Markdown rather than raw `**`, shows exact timestamps, and keeps source metadata beneath the body.
- Verify Available notes refreshes immediately and keeps every separate clue visible after walking, changing modes, reload, focus-triggered sync, and switching between localhost and the production site.
- Add a regression test that saves several photo/text clues sequentially on the same panorama while a cloud pull/import interleaves; every note and its own image must survive in creation order without requiring movement.
- Add a regression test using an intentionally all-black image: it must save, remain linked to its own note, sync, reload, and render normally.
- Add a regression test for a newly opened panorama: save its first image clue, then save additional clues without walking; the first and every later clue must retain separate IDs, images, descriptions, timestamps, and Available-notes entries after cloud synchronization and reload.
- Save before/after cloud backups and report exact final counts. Do not claim full image recovery unless every surviving image is verified.
