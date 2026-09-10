# GeoTrainer QA Report — September 10, 2026

## Environment

- Windows / PowerShell, Node.js, React 19, TypeScript 5.8, Vite 6.
- Local project: `C:\Users\user-MSI\Downloads\street-view-randomizer`.
- Google Maps browser key is present in `.env` and has the expected key shape; its value was not printed.
- The user-provided browser console showed repeated HTTP 429 responses from Google Street View's `lh3.googleusercontent.com` panorama-tile CDN.
- Automated browser control was requested twice but no browser was available to the QA environment.

## Existing test tooling discovered

- `tsx --test` with Node's built-in test runner.
- `fake-indexeddb` for isolated persistence tests.
- TypeScript check through `npm run lint`.
- Production Vite build through `npm run build`.
- Impeccable static UI detector.
- No usable Playwright, connected browser, or other browser automation was available. No large browser framework was installed.

## Commands executed

```text
npm test
npm run lint
npm run build
npm audit --audit-level=moderate
node .../impeccable/scripts/detect.mjs --json ...
npm run dev
Invoke-WebRequest http://localhost:3000/
```

Final command results:

- `npm test`: PASS — 4/4 tests.
- TypeScript: PASS.
- Production build: PASS.
- Dependency audit: PASS — 0 vulnerabilities.
- Impeccable detector: PASS — no findings.
- Vite HTTP health: PASS — application and source entry returned HTTP 200.

## Gameplay scenarios executed

- Full live Study/Play/Review gameplay: **NOT TESTABLE** from the QA environment because no browser was available.
- The user's real session supplied evidence for Reveal rendering, the TrainerHub runtime crash, incorrect country attribution, and Google Street View tile 429 responses.
- No claim is made that 20 sequential Study locations, 3/5/10/15-round games, real movement controls, fullscreen, or the final requested gameplay run were executed.

## Bugs reproduced

1. **PASS — reproduced and fixed:** `TrainerHub` imported Lucide's `Map` icon as `Map`, shadowing JavaScript's built-in `Map`. Aggregation crashed after IndexedDB data loaded.
2. **PASS — reproduced in an automated regression test and fixed:** the randomizer labeled a panorama with the seed country without validating Google's returned coordinates. This produced an Italian flag/code for a location reverse-geocoded to Ukraine.
3. **PASS — reproduced by code-path analysis and fixed:** an aborted Street View lookup could finish and overwrite the newest request.
4. **PASS — fixed at the shared round boundary:** timeout and manual submit could enter the same round before React state committed.
5. **PASS — fixed:** a failed next-round search could leave the previous panorama guessable as the new round.
6. **PASS — fixed:** Play error retry previously called the Study randomizer rather than retrying the configured game collection.
7. **PARTIAL:** Street View tile 429 responses remain externally observable. Duplicate tile pressure was reduced by loading canonical locations with `setPano()` only instead of `setPosition()` followed by `setPano()`, but Google quota/CDN recovery could not be verified.

## Fixes made

- Removed the `Map` identifier collision in `TrainerHub`.
- Reverse-geocode every candidate panorama and reject it unless the resolved country belongs to the selected collection.
- Recheck `AbortSignal` after every non-cancellable Google callback and before returning a result.
- Only the owning `AbortController` may clear loading state or publish a panorama.
- Clear stale locations before Study and Play searches.
- Added a synchronous one-submit-per-round latch.
- Abort pending requests and clear timers on abandon and mode changes.
- Route Play retries through the active game's collection and timer settings.
- Removed the redundant `setPosition()` panorama load.
- Cleaned up Guess Map, result-map, and coverage-map listeners and markers.
- Added the GeoTrainer launch surface requested after the QA brief; no new training capability was introduced.

## Regression tests added

- Wrong-country candidate is rejected and the next valid candidate is returned.
- Aborted lookup cannot return a stale panorama.
- Distance and score boundary behavior.
- Migration runs twice without duplicating games, locations, bookmarks, collections, or attempts.
- Legacy localStorage values remain intact.
- Repeated panorama encounters keep one canonical location while visits remain separate.
- Separate attempts for the same panorama remain separate.
- `<4000`, `<2000`, and wrong-country queue behavior.
- Review interval expansion and lapse count.
- Export → clear → Replace restores stores.
- Repeated Merge deduplicates stable IDs and retains attempts.
- Malformed import is rejected without changing stored attempts.

## IndexedDB / migration results

**PASS** in isolated IndexedDB tests.

- Schema creation, stable keys, legacy migration flag, repeat startup, canonical location deduplication, separate visits, separate attempts, games, bookmarks, collections, selected collection, reviews, and sessions were exercised.
- Legacy localStorage values were confirmed to remain present.
- Real-browser close/reopen persistence is **NOT TESTABLE** without browser automation.

## Export / import results

**PASS** in an isolated disposable database.

- Backup schema validation passed.
- Replace restored locations, attempts, visits, reviews, collections, and other stores.
- Importing the same backup through Merge did not increase canonical location or attempt counts.
- Malformed input failed before a write and existing data remained intact.
- Clicking the browser download/upload controls is **NOT TESTABLE** in this environment.

## Browser console results

**PARTIAL**.

- Earlier `TrainerHub` React exception: root cause fixed; build and static checks pass, but post-fix browser replay is not available.
- React DevTools message: informational.
- Roboto slow-network fallback warning: informational and originates from Google Maps resources.
- Google Street View panorama tile HTTP 429: unresolved external runtime condition. Check the Maps JavaScript API project's billing/quota dashboard and HTTP-referrer restrictions, then retry after the rate-limit window.
- No new console capture was possible after fixes.

## Screenshot / visual observations

**PARTIAL**.

- The supplied Reveal screenshot showed readable controls and no pre-Reveal leak evidence, but exposed the country-code attribution bug now fixed.
- Static Impeccable detection reports no current findings.
- Study, Play, map guess, result, summary, Review, Coverage, desktop, and mobile screenshots were **NOT TESTABLE** after the final changes.

## Final gameplay run

```text
Study: 10 random locations — NOT TESTABLE
Play: 5-round Standard — NOT TESTABLE
Play: 5-round No Move — NOT TESTABLE
Play: 3-round NMPZ — NOT TESTABLE
Review: one mistake queue — NOT TESTABLE
Persistence reload — NOT TESTABLE in a real browser; PASS in isolated IndexedDB
Backup export — NOT TESTABLE through UI; PASS at repository level
```

## PASS / PARTIAL / FAIL matrix

| Area | Result | Evidence |
|---|---|---|
| TypeScript / build | PASS | Commands completed successfully |
| Unit/regression tests | PASS | 4/4 tests |
| Dependency health | PASS | 0 vulnerabilities |
| Legacy migration | PASS | Isolated double-start migration test |
| IndexedDB integrity | PASS | Isolated persistence and deduplication tests |
| Export/import core | PASS | Replace, Merge, malformed-input tests |
| Randomizer country integrity | PASS | Mocked Google result regression test |
| Newest-request-wins | PASS | Abort regression test and controller ownership |
| Study live gameplay | NOT TESTABLE | Browser unavailable / Google tile 429 |
| Play full games | NOT TESTABLE | Browser unavailable / Google tile 429 |
| Movement restrictions | NOT TESTABLE | Requires real Street View interaction |
| Timer lifecycle | PARTIAL | Static lifecycle audit and submit latch; no live timeout run |
| Review UI | PARTIAL | Repository logic tested; live panorama review unavailable |
| Coverage UI | PARTIAL | Seed separation inspected; live map unavailable |
| Refresh/crash recovery | PARTIAL | Durable writes tested; transient UI reload unavailable |
| Rapid input | PARTIAL | Abort and duplicate persistence tested; UI spam unavailable |
| Screenshot QA | PARTIAL | One user screenshot plus static detector |
| Console health | PARTIAL | Known 429 remains; no post-fix browser capture |
| 30-location performance | NOT TESTABLE | Browser unavailable / Google tile 429 |
| Overall | PARTIAL | Data layer is strongly tested; real gameplay still needs one clean browser run |

## Remaining known issues

1. Google Street View tile requests currently receive HTTP 429. The application now avoids a redundant panorama request, but project quota/billing/referrer state must be verified in Google Cloud and a fresh browser run is required.
2. Only 58 countries currently have generation metadata in `countries.ts`; “every country with any Google coverage” is **NOT IMPLEMENTED** and was not silently claimed.
3. `randomstreetview.com` was not embedded or scraped. It does not provide GeoTrainer's stable `panoId`, attempt, country-validation, and persistence contract; an external link would be a separate untracked experience.
4. Real 20/30-location, all-round-count, movement-rule, fullscreen, screenshot, console, reload, and close/reopen scenarios remain **NOT TESTABLE** in this environment.

The safe next action is one clean manual browser run after the Google 429 condition clears, using the exact final sequence above. Export progress before that run so the disaster-recovery path is available.
