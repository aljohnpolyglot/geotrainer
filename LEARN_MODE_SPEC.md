# Learn mode specification

Status: proposed; implementation waits for user greenlight.

Date: 2026-09-12

## Product decision

Rename the user-facing **Study** destination to **Learn** and give it three ways to choose a panorama:

1. **Custom** — the current collection, country mix, environment, and sampling workflow.
2. **Meta** — guided lessons built from the supplied OpenGuessr checkpoint.
3. **Explore Map** — choose any available Street View location from a world map.

Internally, the existing `study` mode may remain named `study` to keep the change small and preserve saved workspaces. Play, Review, saved games, scheduling, and existing history stay compatible.

There is no bookmark action in these new workflows. Every explicit **Save for Review** action creates or reuses the location's ungraded Review source so the learner can restudy it. Existing bookmark data and compatibility code are not deleted as part of this change.

## Existing-product research

The current application already provides most of the required flow:

- `StudySetupModal` owns collection, focused-country, environment, urban-level, and sampling choices.
- `useStudyMode` opens and records Study visits, handles panorama movement, captures one current-view screenshot on an explicit Review save, creates a reusable source attempt, and queues the panorama for spaced review.
- `StreetViewContainer` already supports movement, panning, zooming, compass state, panorama changes, and restoring the current view.
- `useReviewMode` reopens a saved panorama, records a new immutable Review attempt, and derives scheduling from the submitted guess.
- `AiCoach` already switches from spoiler-safe analysis before a Review guess to explanation after submission.
- Saved user clues exist in IndexedDB and are browsable in the Clues library, but there is currently no inline **Show Clues** toggle attached to an active Review panorama. That inline control is part of this proposal.

The supplied checkpoint is 3,031,496 bytes and reports:

- schema `openguessr_overnight_harvest` version `7.0.0`;
- 359 normalized Meta records;
- 336 unique target panorama IDs in those pairs;
- 337 unique locations reported from the locations endpoint;
- Meta text and a locally hosted reference image on all 359 records.

Only the normalized lesson fields are needed: stable lesson ID, panorama ID, latitude, longitude, heading, Meta text, optional comparison note, and reference-image URL. Raw modal HTML, request logs, source URLs, capture timing, and duplicate endpoint payloads should not ship in the app.

## Entry UI

Selecting **Learn** from the home screen or top navigation opens one Learn setup surface with three large, keyboard-accessible choices.

### Custom

Selecting Custom reveals the current Study fields in the same surface:

- collection hierarchy;
- optional focused country mix;
- environment;
- urban level when relevant;
- natural or balanced sampling;
- **Start learning** action.

The panorama flow remains the current one: explore first, optionally reveal the answer, use Coach or save a clue, save for Review, or move to the next random location.

### Meta

Selecting Meta shows a short dataset summary and one action: **Start Meta lessons**. Lessons open in shuffled order by default, avoiding an immediate repeat where possible. No extra sorting or playlist system is required initially.

The panorama opens at the recorded heading. A lightbulb beside AI Coach toggles the Meta panel, which shows:

- the reference image;
- the teaching statement;
- the comparison note when present;
- lesson progress;
- **Save for Review**;
- **Next Meta**.

The first time Meta learning opens, a short advice message points to the top-right lightbulb. **Okay** closes the advice for the current visit; **Don't show again** permanently hides only this advice. It never removes or skips a lesson, and the Meta lightbulb remains available.

Meta lessons use the existing Learn flow: Reveal/Hide toggles the location card, Save for Review schedules the panorama for later pinpointing, and Next Meta moves on. Movement, pan, zoom, compass, AI Coach, clue capture, visit history, and reload restoration remain unchanged.

A Meta lesson enters **My Clues** only after the learner explicitly saves its location for Review. Opening the lightbulb, visiting, or moving through the panorama does not save it.

Saving a Meta lesson stores one reusable Review source for the panorama and an optional reference to its Meta lesson ID. Saving the same panorama again must not create duplicate source cards or duplicate schedules.

### Explore Map

Selecting Explore Map opens a full-world Google map with the standard blue Street View availability layer. The primary instruction is **Click blue coverage to open Street View**.

On a map click:

1. Show a small loading state at the selected point.
2. Ask Google for the nearest panorama within a tight radius.
3. If found, resolve its canonical panorama ID and coordinates, then transition into the normal Learn panorama.
4. If none is found, keep the map open and show a short retry message without losing the current map position.

The chosen panorama keeps the normal movement, compass, Coach, clue, history, screenshot, and reload behavior. Reveal/Hide toggles the existing location card, whose Save for Review action schedules it. A top-left **Back to world map** action replaces Next.

Moving along linked Street View imagery updates the active panorama through the existing panorama-change flow. Saving always targets the panorama currently being viewed, not merely the original map click.

## Save for Review behavior

All three Learn sources use the same action and Review pipeline:

- **Save for Review** creates or reuses one ungraded source card keyed by panorama identity.
- The action queues the panorama according to the current automatic scheduler.
- One screenshot of the current view is persisted when the user saves.
- The source is marked as Custom, Meta, or Explore Map for useful Review context.
- A Meta source keeps only a Meta lesson ID; the bundled dataset remains the source of the Meta text and reference-image URL.
- Older records without source fields, Meta IDs, or screenshots remain valid.
- Saving a clue from Learn continues to create the reusable Review source automatically and removes the redundant Save for Review action afterward.

Review attempts remain new immutable records and never mutate their Learn source.

## Review hint and clue controls

When an active Review item has supporting material, a compact control group appears beside the AI Coach launcher:

- **Hint** for a saved Meta lesson;
- **Show Clues** when the user has saved one or more clues for that panorama;
- **AI Coach**, using the existing launcher.

Each control is a true toggle with pressed state, keyboard focus, and an accessible label. Only one auxiliary panel is open at a time so the panorama is not covered by overlapping panels. Clicking the active control closes its panel.

### Before the Review guess

Review must not receive or render answer metadata before submission. Many Meta statements explicitly name the country, and saved Coach analyses can contain country candidates. Therefore:

- **Hint** may show the Meta reference image as a visual hint, but not the full Meta text, comparison note, country name, coordinates, or answer metadata.
- **Show Clues** may show saved clue imagery for the current panorama, but not saved analysis text, candidates, country labels, or exact-place estimates.
- **AI Coach** remains in its existing spoiler-safe Analyze flow.
- The full Meta and clue records are not passed into the pre-guess Review presentation component.

Using a visual hint does not invent a score or expose manual scheduling controls. The submitted distance and score still determine the automatic Review grade.

### After the Review guess

After submission, answer metadata is available and the same controls expand to their full teaching content:

- **Hint** is relabeled **Meta** and shows the reference image, full teaching statement, and optional comparison note.
- **Show Clues** shows the user's saved clue image and full saved analysis; multiple clues can be stepped through inside the panel.
- **AI Coach** uses its existing Explain state with the submitted result and answer context.

If a Review item has no Meta association, the Hint/Meta control is absent. If it has no saved user clue for that panorama, Show Clues is absent. AI Coach remains independent of both.

Meta and saved user clues are panorama-level learning material, not copied into each Review attempt. A newly created Review attempt only references its source attempt as it does today.

## Personal notebook

A Notebook toggle sits in the same top-right learning-aids group beside Meta and AI Coach. It is scoped to the current panorama and supports:

- a user-written personal hint or note;
- pasting or uploading an external reference image;
- capturing the current Street View;
- optional AI Coach analysis through the existing clue-capture flow;
- saving the note and location for Review.

The notebook is not a separate collection system. It supports multiple independent personal notes per panorama; category and text are optional, including an empty save used only to schedule the place. Analyzed images continue through the existing saved-clue record. A counted **Available notes** control opens an unbounded, internally scrollable panorama history containing Personal and AI-assisted entries; Meta stays in its separate lesson panel. Coach analyses append there immediately and do not restore as the active Coach result after reload. **My Clues** provides source filters, and each row opens a detail view with Street View plus the exact compressed saved/reference-image overlay when available. In Review, personal answer-bearing text is withheld until after the guess; visual clue imagery remains available through the spoiler-safe hint controls.

## Layout and responsive behavior

- Desktop: the available Hint, Show Clues, and AI Coach launchers form one small vertical tool rail near the existing Coach position. Their panel opens inward over the panorama.
- Mobile: the launchers form a bottom tool row above Google controls. The open panel is viewport-bounded and internally scrollable, with its close action always reachable.
- Street View remains the largest surface.
- Panels use the existing GeoTrainer paper/storm-blue visual language and existing control sizes.
- No nested page scrolling, hidden scrollbars, or modal replacement of the main menu.
- Country names shown after reveal/submission include the existing FlagCDN flag when a known ISO code is available.

## Loading, empty, and failure states

- Invalid or unsupported checkpoint records are skipped during normalization rather than breaking Meta lessons.
- A stale checkpoint panorama is reopened through the existing fallback panorama path; the record keeps the original panorama identity for history.
- If a Meta reference image fails, show **Reference image unavailable** and keep the text lesson usable.
- External Meta images are displayed transiently and are not downloaded into IndexedDB or bundled as copied assets.
- Explore Map reports **No Street View found near that point** and stays on the map.
- Reverse-geocoding failure does not discard a valid panorama; saving is blocked only when the minimum Review identity cannot be established safely.
- An empty Meta dataset shows a direct unavailable message and a route back to Learn choices.
- Reload restores the active Learn source and current panorama without carrying Meta or clue panels into a different location.

## Google Maps feasibility research

Google's official Maps JavaScript documentation confirms the required native pieces:

- [`StreetViewCoverageLayer`](https://developers.google.com/maps/documentation/javascript/reference/street-view#StreetViewCoverageLayer) renders where Street View is available and attaches directly to a map with `setMap`.
- [`StreetViewService.getPanorama`](https://developers.google.com/maps/documentation/javascript/streetview#StreetViewServiceRequests) searches around a clicked latitude/longitude. The request supports a radius and nearest/best preference; Google's example uses a 50-meter search for map clicks.
- [`StreetViewPanorama`](https://developers.google.com/maps/documentation/javascript/streetview#StreetViewPanoramas) can open a panorama independently, set its panorama ID and point of view, and preserve the existing movement controls.
- Google's [direct-access example](https://developers.google.com/maps/documentation/javascript/examples/streetview-service) demonstrates the same map-click → nearby panorama → open Street View sequence proposed here.

This means Explore Map needs no new dependency and should reuse the already-loaded Google Maps JavaScript API.

## Minimal implementation shape

The smallest durable implementation should:

1. Keep the internal `study` app mode for saved-workspace compatibility and change only visible terminology to Learn.
2. Extend the existing Learn setup with a source choice rather than add another top-level app mode.
3. Normalize the checkpoint into one local data file containing only lesson fields used by the product.
4. Add optional, migration-safe source and Meta identifiers to the reusable Review source record.
5. Route Custom, Meta, and Explore Map panoramas through the existing Study visit and Save for Review functions.
6. Reuse the existing Google Map and Street View patterns for the coverage selector.
7. Add one shared Review-aids launcher group around the existing AI Coach launcher.
8. Query Meta and saved-clue availability by panorama ID; do not duplicate their full content into attempts.

No new dependency, bookmark workflow, manual SRS rating, new database, or separate Meta review engine is needed.

## Acceptance criteria

- Learn presents Custom, Meta, and Explore Map without changing Play or Review entry behavior.
- Custom preserves every current Study filter and action.
- Meta opens the correct panorama and recorded heading for a normalized checkpoint lesson.
- Explore Map displays native blue Street View coverage and opens the nearest valid panorama after a click.
- Meta and Explore Map use Reveal/Hide for the shared location card; saving there schedules normal Review pinpointing without advancing automatically.
- Every explicit save produces one reusable Review source and one current-view screenshot without duplicate schedules.
- A saved Meta Review item has a Hint toggle before guessing and a full Meta toggle after submission.
- A Review item with saved user clues has a Show Clues toggle beside AI Coach.
- Learn and post-answer Review provide a panorama-scoped Notebook for personal notes and optional analyzed reference imagery.
- Pre-guess Review receives no country, coordinates, Meta text, saved analysis, candidates, or other answer metadata through those panels.
- Post-submit panels show full allowed learning material.
- Review scheduling remains automatic and derived from score/distance.
- Active Learn state survives reload and remains scoped to its panorama.
- All new visible copy is complete in English, Spanish, Portuguese, French, German, Italian, Russian, and Swedish.
- Desktop and mobile checks confirm map usability, panel scrolling, reachable primary actions, and visible keyboard focus.
- Focused tests cover checkpoint normalization, duplicate Review saves, map lookup failure, and pre-guess hint redaction/data separation.
- Type-check, tests, build, locale browser checks, required workflow browser checks, documentation updates, and the dated changelog entry pass before handoff.

## Explicitly out of scope

- Deleting or migrating old bookmark records.
- Downloading or persisting Google Street View imagery except the existing explicit-save screenshot.
- Adding a Meta editor, remote media service, or runtime dependency for the locally bundled reference images.
- Importing raw OpenGuessr HTML or network logs.
- A Meta editor, playlist builder, search system, or cloud content service.
- Manual Again/Hard/Good/Easy Review controls.
- Showing answer-bearing Meta or saved Coach text before a Review guess.
