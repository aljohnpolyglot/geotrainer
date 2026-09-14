# Street View Trainer contributor guide

## Scope

- Preserve Study, Play, Review, IndexedDB history, bookmarks, coverage, and saved-game compatibility.
- Prefer small changes that reuse existing components and services; do not redesign unrelated UI.
- Keep Street View imagery transient. Never download or persist it unless the user explicitly asks.
- Persist one current-view screenshot when the user explicitly saves a location or submits a Play answer; treat older records without screenshots as valid.
- Compress explicitly uploaded or captured Notebook and AI Coach clue images, sync them to private per-user Supabase Storage, and render that exact hosted image in Available notes and My Clues. Preserve local-only fallback for signed-out or offline saves.
- My Clues rows and details must show the hosted preview, note type, note text, and exact creation time when present; never substitute a general panorama screenshot for a submitted clue image.
- Keep My Clues source and timestamp metadata beneath the note body rather than inline with its country, category, or text.

## Commands

- Install: `npm install`
- Develop: `npm run dev`
- Type-check: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

Run type-check, tests, and build before handing off user-visible changes.

## Security

- Gemini and Google API secrets stay server-side or in ignored environment files.
- Load persisted language preferences before rendering or enabling Coach analysis, and require every natural-language Coach response value to use the selected AI language without translating JSON keys or ISO codes.
- Reject and retry substantially mixed-language Coach output before displaying it; render candidate country names in the selected AI language and require each ranked country to explain a concrete visible feature that distinguishes it rather than merely claiming the scene is consistent, similar, common, or typical.
- Shuffle the starting Gemini key and exhaust all available non-cooling keys on retryable Coach failures before surfacing an error.
- Never place secrets in `src`, browser storage, IndexedDB, logs, reports, or committed examples.
- The browser may call only the local coach endpoint; it must never call Gemini with a private key.

## Data and UX

- Never expose developer notes, defensive privacy/auth implementation commentary, storage implementation details, environment-variable instructions, or internal architecture language in user-facing UI.
- Keep product documentation on the standalone `/docs/` page, opened in a new browser tab from a clearly labeled Guide entry. Never display it as a modal or replace the main menu with it unless explicitly requested.
- Avoid military, tactical, command-center, and field-operations jargon in user-facing copy. Use direct learning and gameplay language.
- New persisted fields must remain optional or have migration-safe defaults.
- Review attempts are new records; never mutate the original Play attempt.
- Before a guess, Review must not receive the current card's persisted answer metadata, but every learner-opened tool may render its full saved or newly generated content, including Meta explanations, note text, country candidates, and probabilities.
- Review scheduling is derived automatically from guess distance/score. Never show manual Again/Hard/Good/Easy controls.
- Treat same-country locations within 50 metres as one Review card across Play, Study, Notebook, and Coach sources.
- Use that same 50-metre identity for panorama-scoped Available notes and its badge so nearby Street View nodes share Coach and Notebook history.
- Default fresh profiles to 50 new cards and 500 total reviews per day; persisted user overrides win.
- Include AI-assisted Play in Statistics by default while retaining the visible exclusion checkbox.
- Keep the homepage Known clues total aligned with My Clues across Personal, AI-assisted, and Meta entries; do not count a Notebook-linked clue image twice.
- Apply My Clues filters before pagination, show 20 matching entries per page, and return to the first page when filters change.
- Show Review improvement, Sessions, and every History tab 10 entries per page; reset History to page one when its tab or filters change.
- Count foreground time across Study, active Play, and active Review work, including panorama movement and learning-aid use; persist it when switching surfaces or returning home. Exclude session records without a Study visit, Play attempt, or Review attempt from every visible session count and active-time total.
- Apply cloud imports to mounted screens without reloading the page or replacing the learner's active workspace.
- Coalesce local cloud-sync bursts, skip unchanged whole-backup writes, throttle repeated focus-triggered cloud pulls, and serialize read-modify-write updates such as Coach history so reliability fixes do not recreate Supabase I/O amplification.
- Treat ungraded Learn review sources as new cards, never as no-guess or wrong-country attempts.
- Exclude ungraded Study source cards from scored attempt history and performance totals; restored Study workspaces resume the latest matching visit instead of inserting a reload visit.
- Derive every next-review label from the actual persisted queue using the same effective due-time calculation; never present a hypothetical new-card time as the next scheduled review.
- Study may offer one ungraded “Save for Review” action; it creates one reusable source card, never invents a score, and must remain recognized as saved after reload.
- Environment is a generator/filter dimension, not a duplicate collection system.
- The Official / Mixed / Contributor imagery selector filters only newly generated Custom Learn and Play locations and defaults to Official; it does not alter Meta, Explore Map, saved locations, History, or Review.
- Country and city datasets are local data files, not UI-component constants.
- Configure the Google Maps JavaScript loader through one shared promise so development remounts cannot call `setOptions` twice. Keep already-opened map surfaces mounted while their tab or panel is hidden, and resize the retained instance when it becomes visible again; rely on Google's browser cache rather than persisting map imagery locally.
- Keep Vite lifecycle diagnostics development-only and exclude secrets, account data, locations, and saved content from their console payloads.
- Show a FlagCDN flag beside country names whenever a known ISO country code is available in visible UI; keep text names for accessibility and clarity.
- Keep AI Coach as one continuous Analyze flow per location: preserve observations while the user moves or reveals the answer, hide capture implementation choices, and present learning notes as evidence plus explanation rather than card-front/card-back terminology.
- Keep exactly six user-selected AI Coach styles: Quick Guess, Meta Coach, Elimination Coach, Deep Geography, Memory Coach, and Pro Analyst. Explanation depth is independent; never add Adaptive or automatic style switching. Fresh profiles ask for a style per analysis, while selecting a preferred style in Settings skips that picker.
- Build every Coach style from the same visible-observation pass, keep speculative identities and causal stories out of country evidence, and describe likelihood percentages as AI estimates rather than measured probabilities.
- Keep Play's panorama learning toolbar aligned with Study and expose the same Notebook and Available notes count; its existing AI Coach preference may still hide Coach only.
- Append every completed Coach analysis immediately to the panorama's Available notes history. Keep that history scrollable and available in Review, but do not restore an old analysis as the active Coach result after reload.
- Show optional Coach region, city, landmark, or exact-place estimates only without answer metadata and only when multiple strong visible clues support them; omit them otherwise.
- Supply country-specific external reference facts only during post-reveal Coach explanations, and mention a fact only when its feature is visibly present in the submitted imagery.
- In pasted-clue analysis, prioritize an obvious foreground subject selected by the user and treat the surrounding scene as supporting or contradictory context; state when the subject is unreadable instead of misidentifying it.
- AI Coach knows imagery is shown inside a GeoGuessr-style app and must ignore all app/browser chrome, controls, navigation arrows, attribution, cursors, and interface language as geographic evidence.
- When a submitted clue centers on a sign, AI Coach must explain what its visible symbol, letter, number, color, or restriction means before discussing geographic likelihood.
- When a readable brand or organization is central to a clue, explain what it is, its geographic origin or main operation, cross-border availability, and resulting evidence strength.
- Persist clue-image and unsaved Notebook drafts across reloads, scoped to the current panorama. Completed Coach analyses belong in Available notes rather than the active Coach panel.
- Preserve paused Learn and Play workspaces separately. When a saved workspace exists, entering that mode must offer Resume and Start new, with Back returning to the prior screen.
- When saving a clue from Study, create its reusable Review source automatically and do not show a redundant Save for Review action afterward.
- Notebook saves are independent records: allow multiple personal notes per panorama, keep category and text optional, and treat even an empty explicit save as a request to schedule that location for Review. Opening a Meta lesson alone never saves it; only its explicit Save for Review action adds it to My Clues.
- Refresh Available notes and its badge immediately after every Notebook save in every mode; do not depend on Study-only scheduling side effects.
- Meta Learn selects only unfinished lessons and becomes visibly disabled in Learn setup after all lessons are completed.
- Keep focused country pools available in both Study and Play so users can mix commonly confused countries without creating a collection.
- Persist active Review progress, including completed-card statistics, so reloads preserve both the queue and the displayed position; label current, remaining, and saved progress explicitly on every viewport.
- Render every collection selector with the shared World, Continents, Trainer drills, regions, and custom-collections hierarchy.

## Implementation

- Keep this guide current autonomously when a change creates a durable contributor rule, data invariant, supported locale, or required QA step. Do not record temporary task status or implementation trivia here.
- Keep user-facing documentation thorough and current whenever behavior changes, including new modes and learning aids such as Notebook, Meta, and Review hints. Update the relevant concepts, workflows, settings, limitations, edge cases, troubleshooting, and FAQ material rather than adding only a release-note summary.
- Record every user-visible change in `CHANGELOG.md` under the local date of the work session (`YYYY-MM-DD`), not only under an undated Unreleased heading.
- Supported UI/game/AI locales are English, Spanish, Portuguese, French, German, Italian, Russian, and Swedish. Do not add Tagalog, Bisaya, or Indonesian unless explicitly requested later.
- Use TypeScript and existing project patterns; add no dependency when the platform or current stack is sufficient.
- Never let a source file exceed 500 lines. Split it before adding code that would cross the limit.
- Put shared logic in the existing service/data layer and keep React components focused on UI.
- Add one focused runnable test for non-trivial branches and failure handling.
- For language changes, browser-check every supported locale for untranslated visible copy, overflow, reload persistence, and independent UI/game/AI selections.
- For localized or AI-generated text changes, QA accented Latin and Cyrillic output in every supported locale; reject visible escape fragments or mojibake such as `00e0`, `\\u00e0`, or replacement characters.
- For panels and modals, browser-check scroll containment at desktop and mobile sizes. Keep scrollbars thin and unobtrusive, never hide scrolling, and keep primary actions reachable without nested page scroll traps.
- Keep AI Coach, Notebook, Meta, and saved-clue learning panels draggable by their headers and bounded inside the viewport.
- Keep AI Coach, Notebook, linked Meta, saved clues, and Available notes accessible from Coverage location details and scoped to the opened panorama.
- Keep the AI Coach launcher visible while its draggable panel is open.
- Keep the revealed location card draggable by its header, use a minimize affordance for hiding it, and expose the embedded result map's fullscreen control.
- Keep the same mobile pinpointer available in Play and Review, and anchor panorama controls to the dynamic visible viewport so browser chrome cannot cover them.
- Keep sound effects and ambient music opt-in, persist separate volume controls, pause music while hidden, and respect browser autoplay rules.
- Browser-check every new or changed interface in both light and dark modes; use theme tokens instead of fixed surface or text colors so contrast remains readable in either theme.
- Browser-test Study-to-new-card, Play mistake correction, due SRS, custom practice, clue autosave, and quiet cloud sync before handoff.
- For deployment handoffs, generate `.gz` copies of `dist` text assets with Node's built-in zlib after the build; add no compression dependency.
