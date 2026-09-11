# Street View Trainer contributor guide

## Scope

- Preserve Study, Play, Review, IndexedDB history, bookmarks, coverage, and saved-game compatibility.
- Prefer small changes that reuse existing components and services; do not redesign unrelated UI.
- Keep Street View imagery transient. Never download or persist it unless the user explicitly asks.

## Commands

- Install: `npm install`
- Develop: `npm run dev`
- Type-check: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

Run type-check, tests, and build before handing off user-visible changes.

## Security

- Gemini and Google API secrets stay server-side or in ignored environment files.
- Never place secrets in `src`, browser storage, IndexedDB, logs, reports, or committed examples.
- The browser may call only the local coach endpoint; it must never call Gemini with a private key.

## Data and UX

- Never expose developer notes, storage implementation details, environment-variable instructions, or internal architecture language in user-facing UI.
- New persisted fields must remain optional or have migration-safe defaults.
- Review attempts are new records; never mutate the original Play attempt.
- Before a guess, Review must not receive or render answer metadata.
- Review scheduling is derived automatically from guess distance/score. Never show manual Again/Hard/Good/Easy controls.
- Study may offer one ungraded “Save for Review” action; it creates one reusable source card and never invents a score.
- Environment is a generator/filter dimension, not a duplicate collection system.
- Country and city datasets are local data files, not UI-component constants.

## Implementation

- Keep this guide current autonomously when a change creates a durable contributor rule, data invariant, supported locale, or required QA step. Do not record temporary task status or implementation trivia here.
- Record every user-visible change in `CHANGELOG.md` under the local date of the work session (`YYYY-MM-DD`), not only under an undated Unreleased heading.
- Supported UI/game/AI locales are English, Spanish, Portuguese, French, German, Italian, Russian, and Swedish. Do not add Tagalog, Bisaya, or Indonesian unless explicitly requested later.
- Use TypeScript and existing project patterns; add no dependency when the platform or current stack is sufficient.
- Never let a source file exceed 500 lines. Split it before adding code that would cross the limit.
- Put shared logic in the existing service/data layer and keep React components focused on UI.
- Add one focused runnable test for non-trivial branches and failure handling.
- For language changes, browser-check every supported locale for untranslated visible copy, overflow, reload persistence, and independent UI/game/AI selections.
- For panels and modals, browser-check scroll containment at desktop and mobile sizes. Keep scrollbars thin and unobtrusive, never hide scrolling, and keep primary actions reachable without nested page scroll traps.
- Browser-test Study-to-new-card, Play mistake correction, due SRS, custom practice, clue autosave, and quiet cloud sync before handoff.
- For deployment handoffs, generate `.gz` copies of `dist` text assets with Node's built-in zlib after the build; add no compression dependency.
