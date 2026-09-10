# AI Coach Implementation Report — September 10, 2026

## Architecture

```
Study / Review UI
  → POST /api/coach on the local Vite server
  → server-side request validation
  → Gemini key carousel and model fallback
  → Gemini multimodal Generate Content API
  → normalized structured JSON
```

The browser sends the current `panoId`, heading, pitch, and zoom. The local server requests that transient frame through Street View Static API. If Static API is unavailable, the browser asks to share the displayed tab/window, captures one in-memory JPEG, stops the stream immediately, and retries. There is no file picker and imagery is never persisted. Direct canvas scraping remains excluded because cross-origin rendering makes it unreliable.

The compact panel is available in Study and Review. Play remains unassisted and OFF, as requested. The panel resets when the panorama changes.

The presentation takes the useful analysis hierarchy from [GeoSolver](https://reverseimagelocation.com/)—upload, geographic clues, likely area, confidence, and reasoning—while keeping the trainer's existing visual system and avoiding unsupported accuracy claims.

## Gemini and key rotation integration

The NBA commentary carousel pattern was inspected. Its useful behavior—multiple keys, failover, and cooldown—was retained, but its client-side key exposure was not.

- Keys load on the local server only.
- The default source is the existing Premiere extension shared secret store.
- 10 configured keys were detected without printing their values.
- `GEMINI_API_KEYS`, `GEMINI_API_KEY`, or `GEMINI_KEYS_FILE` may override the local source.
- HTTP 429 cools that key for 60 seconds and advances to another key.
- Each model tries at most three currently available keys.
- The whole operation has a 30-second budget and 12-second per-attempt ceiling.
- Default model order is `gemini-2.5-flash`, then `gemini-2.5-flash-lite`.
- Malformed structured output is retried; final failure becomes a small dismissible error and never affects trainer state.

## Security checks

- No Gemini key is referenced by frontend source.
- The production browser bundle was scanned against all 10 configured key values: zero matches.
- Keys are not written to IndexedDB, localStorage, UI, reports, or logs.
- Requests send the key in the server-side `x-goog-api-key` header.
- `.env*`, `*.key`, `*.pem`, `gemini-keys.json`, and `.gemini-keys-path` are ignored.
- Hints and Analyze requests discard all answer context at the server boundary, even if a client tries to submit it.

## Study integration

Before Reveal:

- Hints gives only inspection prompts.
- Analyze gives an honest broad region/vibe, ranked country candidates, confidence, strong clues, weak clues, and next things to inspect.

After Reveal:

- Explain receives only the current actual country plus relevant round context.
- Generate Cards creates a core card and at most two valuable specialized cards.
- “Save coaching note” optionally stores the normalized result on the current Study visit.

Analysis remains optional and one-click; opening the panel does not spend an API request.

## Review integration

Coach is available before the guess without answer metadata and after the result with:

- actual country
- current guessed country
- score and distance
- at most five attempts for the same panorama

The full IndexedDB history is never uploaded. A saved coaching note is attached to the new Review attempt, not the original Play attempt.

Per the later UX decision, Review no longer asks for manual Again/Hard/Good/Easy input. Pinpoint score determines the scheduler grade, and one **Next Review** action advances. Coach failure cannot block this action.

## Card generation

Structured output supports:

- non-spoiler core-card front
- short back explanation
- realistic confusions
- up to two specialized cards from RoadLines, Bollards, Poles, Plates, Signs, Architecture, Plants, Vehicles, Roads, or CoverageMeta
- clue strength from 1–5

Server normalization removes country names, flag emoji, and explicit broad geographic regions from card fronts. The prompt forbids readable answer-revealing language, coordinates, flags, city names, false certainty, generic-vegetation overclaims, and category-filling cards.

## QA performed

- TypeScript: passed.
- Automated tests: 23/23 passed across trainer, analytics, integrity, persistence, flags, and Coach paths.
- Production build: passed.
- 429 test: first key cooled down; second key served the request.
- Malformed JSON test: retry succeeded.
- Hints sanitization test: candidate answers and country-naming hint were removed.
- Card sanitization test: actual country, flag, and “Northern Europe” were removed from Front.
- Secret scan: 10 configured keys checked; none present in browser JavaScript.
- Live Gemini test with a Street View screenshot: `gemini-2.5-flash` returned medium confidence, a broad region, four candidates, three strong clues, and two weak clues.
- Live non-scene test: the model correctly stated that a game menu contained no geographic evidence instead of inventing a location.
- A later pair of live requests hit the bounded failure path; HTTP 429/503/504 now distinguish quota, service/capture, and timeout failures while the trainer remains available.
- UI detector ran once. Its one mechanical finding was corrected.

## Known limitations

- The current Maps key returned `REQUEST_DENIED` for Street View Static API during live QA. Until that API is enabled, native browser capture requires approval of the displayed tab/window.
- Current-view analysis and four-heading Analyze 360° are implemented; the latter fetches four transient quarter-turn frames without persisting Street View imagery.
- Play Coach is intentionally unavailable rather than silently creating assisted competitive history.
- A controllable automation browser was unavailable during QA, so mobile interaction and DevTools storage checks were not automated. User-provided live screenshots verified the desktop Coach and Statistics entry points; type, build, server, bundle, and request-path checks passed.
- Live Gemini availability still depends on key quotas and model access. Failure is bounded and isolated.
- `src/App.tsx` predates the new 500-line contributor rule and remains over that limit. New files comply; splitting the legacy component should be a dedicated low-risk refactor.
