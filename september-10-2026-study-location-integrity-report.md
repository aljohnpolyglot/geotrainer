# Study Location Integrity Report — September 10, 2026

## Root cause

The generator already reverse-geocoded the coordinates returned by `StreetViewService`, but accepted any resolved country that belonged to the selected collection. In World, a request seeded for one country could therefore snap across a border or to unrelated coverage and still be accepted as another World country.

Study also accepted panorama changes from the renderer with the previous location's country code. A delayed `pano_changed`, generation result, or Reveal geocode could therefore combine a new visible panorama with stale metadata. Abort alone did not provide a commit-order guarantee.

The generator had no session-level panorama exclusion, so the nearest lookup could return the current panorama again.

## Duplicate-panorama fix

- Study keeps the 15 most recent canonical `panoId` values in memory.
- The exclusion set is passed into the shared generator.
- An excluded result is rejected before reverse geocoding or persistence and generation continues.
- The exclusion is session-only. It does not alter saved locations or Review history.
- The Street View renderer ignores transitional `pano_changed` events while a requested canonical panorama is loading.

## Stale-request fix

- Every Study and Play generation receives a monotonically increasing request ID.
- Status, success, error, and loading-state commits occur only when that ID is still the latest.
- Starting a newer request invalidates pending panorama synchronization as well as aborting the older network work.
- Renderer movement is reverse-geocoded before the coherent `panoId`, returned coordinates, and resolved country are committed.
- If a moved panorama cannot be resolved, it is not committed as a valid Study location.

## Country-validation fix

The final country is resolved from the coordinates returned by the panorama lookup, not from the candidate seed. It must now equal the specifically requested country and belong to the selected built-in or custom collection. Country bounds and city coordinates remain hints only.

Internal development diagnostics record:

- request ID
- requested country
- candidate coordinates
- returned panorama ID and coordinates
- resolved country
- collection ID

Rejected results never reach the Study commit path and therefore cannot create a Study visit, coverage encounter, or review source.

## Reveal-race fix

Reveal metadata carries the panorama ID captured when geocoding starts. The app saves it only if both the current visible location and active Study visit still have that same ID. Changing panorama immediately hides the old Reveal card. The card also clears its previous geocode state before resolving a new location.

The displayed flag now uses the country code from the same resolved geocode data as the displayed country name, preventing a stale name/current-code combination.

## Regression tests

The full `npm test` suite passed **23/23**, including:

- requested IT → returned UA → reject and retry
- IT and UA both selected → requested IT/returned UA still rejects
- returned A, A, B with A excluded → visible A, B
- aborted lookup cannot return a stale panorama
- request A starts, request B starts, B finishes first → B remains current
- Reveal for panorama A cannot commit to panorama B
- 100 accepted Study operations with injected duplicates → zero consecutive duplicate panorama IDs
- Study Save writes its source card before queueing, makes it due immediately, confirms the save, and automatically advances
- saving a previously scheduled Study panorama again returns it to the Due queue without duplicating its canonical location

`npm run lint` passed. `npm run build` passed.

## 100-location QA results

The deterministic generator QA completed 100 accepted operations. It injected a repeat of the previous panorama every tenth operation; all repeats were rejected and the final visible sequence contained zero consecutive duplicate IDs.

Live Google UI automation could not run because no controllable browser was connected in this session. Therefore the requested live World 50, regional 30, custom 20, rapid-click test, console inspection, and live IndexedDB count inspection remain unverified; no live result is claimed here.

## Existing-data safety

No IndexedDB rows were deleted or rewritten. The new checks apply before new Study persistence. Existing records were not automatically classified as malformed because a country/scene disagreement cannot be proven safely from stored metadata alone without reopening and resolving each panorama.

## Remaining limitations

- Reverse geocoding availability remains a prerequisite for accepting generated or navigated panoramas.
- Google coverage and panorama IDs can change over time.
- A live 50/30/20 collection run and rapid-Next browser test should be completed once browser automation is connected.
