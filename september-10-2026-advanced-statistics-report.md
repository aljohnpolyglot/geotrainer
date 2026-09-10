# Advanced Statistics Implementation Report — September 10, 2026

## Metrics implemented

Statistics is now a main navigation destination with Overview, Geography, Progress, Reviews, Confusions, Coverage, and Sessions views. All values are rebuilt from canonical IndexedDB records; no permanent aggregate cache was introduced.

The first screen compares the recognition ladder for the last 30 days and all time:

- continent accuracy
- geographic learning-region accuracy
- exact-country accuracy
- eligible sample size and unresolved-guess count
- average score, median distance, and average response time
- Study visits today, Play rounds today, reviews completed, active time, and country-balanced accuracy
- current versus previous 30-day country-accuracy change in percentage points
- best rolling 20- and 50-attempt country accuracy

The deeper views add a sortable country table and inline country detail, continent/region breakdowns, sample confidence, date/environment/movement/collection filters, daily/weekly/monthly progress, speed and score buckets, all country/region × environment/movement matrices, review retention/lapses, directional/symmetric country and region confusions, learning velocity, targeted-training comparisons, personal coverage layers, and session history.

## Exact definitions

Default performance input is non-AI-assisted `source === "play"`. Study is exposure only. Review attempts are analyzed separately and are never counted as original Play attempts.

- Country correct: `guessedCountryCode === countryCode`.
- Country unknown: missing guessed country or missing taxonomy on either side. Unknown guesses are excluded from every recognition denominator and shown separately.
- Region correct: actual and guessed country map to the same stable learning region.
- Continent correct: actual and guessed country map to the same normalized continent.
- Attempt-weighted accuracy: all eligible attempts have equal weight.
- Country-balanced accuracy: mean of per-country country accuracy for countries with at least five eligible attempts.
- Mean: arithmetic mean of eligible values.
- Median/p75/p90: nearest-rank values from sorted eligible distances.
- Review improvement: later Review score minus the linked `sourceAttemptId` score. The history is sorted chronologically.
- Samples: `<5 very low`, `5–14 low`, `15–49 moderate`, `50+ strong`.
- Local ranges: Today begins at local midnight; 7/30/90-day ranges include today; custom end dates include the complete local calendar day.

## Geographic taxonomy

`src/data/geography.json` is a local 250-entry country/territory snapshot derived from the open [REST Countries dataset](https://github.com/mledoze/countries). `src/analytics/geography.ts` normalizes Americas into North/South America at continent level and uses fixed trainer learning groups for Baltics, Nordics, Central Europe, Balkans/Southeastern Europe, Caucasus, and Middle East. Other entries retain stable dataset subregions with normalized names such as North Africa, Central Africa, South Asia, Southeast Asia, and East Asia.

Collections do not define geography. The same taxonomy powers hierarchical built-in collection groups: World, Continents, trainer drills, then each continent's regions. Existing legacy collection IDs remain valid for saved games/settings.

## IndexedDB and query changes

Database version 2 adds migration-safe indexes without altering stored records:

- attempts: `panoId`, `countryCode`, `createdAt`, `source`, `collectionId`, `environmentRequested`, `gameId`
- Study visits: `panoId`, `openedAt`, `countryCode`, `collectionId`, `environmentRequested`
- locations: `countryCode`
- games: `createdAt`
- reviews: `dueAt`

Analytics uses in-memory memoization for the current loaded history. Import/export remains canonical-history-only; reopening Statistics deterministically rebuilds every metric after import.

## Charts and tables added

- 30-day versus all-time recognition ladder
- sortable-by-learning-priority continent, region, and country tables
- sortable country detail with exposure, Play/Review counts, accuracy, score, distance, time, due reviews, confusions, recent attempts, environment, and movement splits
- grouped daily/weekly/monthly progress tables
- speed-versus-accuracy and score-distribution tables
- country/region × environment/movement matrices; every accuracy cell shows `n=`
- Coverage marker layers for exposure, accuracy, average score, weakness, and reviews due
- activity heatmap, learning velocity, targeted-training before/after comparison, and session summaries

Native HTML date/select controls are used; no chart or date-picker dependency was added.

## Review analytics

The Review section shows completed attempts, due records, unique reviewed locations, mean source score, mean review score, mean improvement and its eligible sample, automatic grade totals, and chronological per-attempt improvement rows. Linking requires a valid `sourceAttemptId`; incomplete legacy Review records are not guessed.

Retention is calculated only from later Review attempts spaced by at least 1/7/30 days after a country-correct review and is displayed only at `n≥5`. A lapse is a country-correct review followed by a wrong review of the same panorama. Country and location lapse tables preserve those counts.

Manual Again/Hard/Good/Easy UI has been retired. Review grade remains an internal result of actual score. Study now has one ungraded **Save this location for Review** action, shows a saved confirmation, and advances automatically.

## Confusion analytics

Directional mistakes retain order (`EE → LV`). Symmetric confusion sorts and combines both directions (`EE ↔ LV`). Both tables provide a one-click confusion drill using the existing temporary collection path. The deterministic interpretation uses full country names.

## Performance considerations

Canonical records are loaded once per Trainer Hub refresh and computations are memoized by input/filter. Country-table grouping is linear in loaded history rather than repeatedly scanning it per country. The new indexes prepare direct range/group queries when history makes full startup reads measurable. Persistent aggregates were deliberately not added because they can drift and are unnecessary at current scale.

The production bundle currently emits Vite's existing >500 kB chunk warning. Route-level code splitting should be added when startup profiling shows a real cost.

## QA fixtures and results

Automated suite: **23/23 passed**.

- Recognition fixture: 10 eligible attempts produced exactly 80% continent, 60% region, 40% country.
- Unknown fixture: one unresolved guess increased `unknown` without changing the eligible denominator.
- Source fixture: Study, Review, and AI-assisted Play were excluded from default Play performance.
- Range fixture: local Today, 7/30/90-day and inclusive custom-date boundaries passed; environment membership remained exact.
- Review fixture: 1,200 → 4,200 produced exactly +3,000; multiple reviews remained chronological.
- Confusion fixture: `EE → LV = 3`, `LV → EE = 2`, symmetric `EE ↔ LV = 5`.
- Large fixture: 1,000 attempts across 30 countries, dates, Urban/Rural, Standard/No Move/NMPZ produced finite values and no NaN.
- Existing generator QA: 30 Urban and 30 Rural strategy samples passed; 100 accepted Study locations had zero consecutive panorama duplicates.
- Study-save fixture: a saved Study panorama appeared in Due, left Due after scheduling, and returned to Due when explicitly saved again.
- Flag fixture: Albania, Morocco, and Åland resolve to their own ISO FlagCDN paths.
- TypeScript compilation passed.
- Production build passed.
- User-provided live screenshot verified Statistics against real existing IndexedDB without deleting or rewriting progress. It exposed an unstyled first pass; layout, tabs, ladder cards, tables, sample labels, filters, matrices, and responsive stacking were then corrected.

## Known limitations

- The Progress view uses compact grouped tables rather than canvas/SVG line charts. The data layer already provides the stable buckets; a chart library was intentionally not added.
- Coverage overlays color encountered panorama markers, not whole country polygons. Country-polygon choropleths require a boundary dataset and are deferred.
- Country detail is inline rather than a separate routed page.
- Older sessions lack explicit attempt ownership, so session attribution uses the session timestamp interval and is documented as such.
- `src/App.tsx` and the pre-existing multi-panel `TrainerHub.tsx` remain legacy files above the new 500-line contributor ceiling. `AGENTS.md` prevents new source files from crossing 500 lines; splitting these two safely is still a dedicated structural task.
- Automated browser control was unavailable. Desktop behavior was checked through user-provided live screenshots; mobile visual interaction remains manual QA.
