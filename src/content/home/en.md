# GeoTrainer Manual

GeoTrainer turns Street View exploration into deliberate geography practice. Study unfamiliar places, test what you can recall, and revisit weak locations on a schedule that adapts to your results.

This manual explains the learning model, every training mode, review scheduling, statistics, AI-assisted clue work, sync, and common recovery steps.

## Introduction

GeoTrainer treats each panorama as a reusable learning location. The same place can appear as an ungraded Study visit, an independent Play attempt, and a scheduled Review card without overwriting what happened before.

### What GeoTrainer is for

- Building recognition for countries, regions, cities, and landscapes.
- Practising visual evidence such as road markings, driving side, scripts, poles, terrain, vegetation, architecture, and camera clues.
- Keeping mistakes useful by turning weak guesses into future review.
- Measuring the places you have actually encountered instead of implying complete map coverage.

### What it does not do

Country and city datasets are starting points for panorama generation, not an atlas of every Street View location. AI analysis is a study aid, not an answer authority. Coverage reflects your own encounters only.

## Learning background

Two ideas drive the trainer: active recall and spaced repetition. Understanding them makes the Study–Play–Review loop much more effective.

### Active recall

Recognition can feel convincing even when you cannot name a place. Active recall forces you to commit to a location before seeing the answer. The act of retrieving a conclusion strengthens memory and exposes uncertainty that passive browsing hides.

In GeoTrainer, Play and Review are recall tests. Look for evidence, decide how the clues fit together, and place a guess before revealing the real location.

### Use it or lose it

Geographic clues fade when they are seen once and never retrieved. Repeating every location equally is wasteful, while ignoring weak locations lets them disappear. Review concentrates effort where forgetting is most likely.

### Spaced repetition

A difficult result returns sooner. A strong result waits longer. As a location becomes reliable, the gap between reviews grows, saving time without abandoning the memory.

GeoTrainer calculates the result from country correctness, pinpoint distance, score, response time, and the selected strictness. There are no manual Again, Hard, Good, or Easy controls.

## Quick start

### First session

1. Open Study and inspect a few unfamiliar panoramas.
2. Form a guess before using Reveal.
3. Save a useful location for Review if you want to practise it later.
4. Start a short Play game and submit every guess without outside help.
5. Open Review when locations become due.

### A useful daily routine

Do due reviews first, then play a small batch of new rounds. Use Study when you want slower exploration or when a clue family needs deliberate attention. Consistency matters more than a large one-day session.

## Core concepts

### Locations

A location is anchored to its Street View panorama when possible. Coordinates, country, locality, environment, and other details provide context, but the panorama identity keeps repeat encounters connected.

### Attempts

Every submitted Play or Review guess is a new attempt. The original attempt is never rewritten when you improve later, so History can show genuine change over time.

### Review cards

A review card schedules a reusable location. Play mistakes can create cards automatically. Study can create one ungraded source card with Save for Review. Review answers add new attempts and update only the card’s schedule.

### Card states

- New — saved but not yet reviewed.
- Learning — recently introduced and still on short intervals.
- Relearning — returned to short intervals after a weak review.
- Young — established, with an interval shorter than 21 days.
- Mature — established, with an interval of at least 21 days.

### Collections

Collections limit the countries used for generation. Built-in collections cover broad geographic groupings. Custom collections let you choose a reusable set of countries without duplicating locations or history.

## Study mode

Study is an ungraded first encounter. It is the right mode for observation, comparison, and learning new clue systems without score pressure.

Study differs from Review in intent: Study introduces or explores freely chosen places, while Review tests previously encountered places when their schedule says they are due. Study has no map guess or score.

### Study setup

Choose a collection or build a focused country mix, then choose the environment and sampling style. The country list follows the selected collection and starts at all countries. Add several commonly confused countries to alternate between them in either Study or Play.

### Studying a panorama

1. Scan the whole scene before zooming into one object.
2. Separate observations from conclusions: record what you see before deciding what it means.
3. Build a shortlist from several clues that agree.
4. Use Reveal only after you have made a private commitment.
5. Move to the next panorama or save the location for Review.

### Reveal

Reveal shows the exact location information for the current Study panorama. Until you reveal it, answer metadata stays hidden. Hiding the answer again does not turn the visit into a scored attempt.

### Save for Review

Save for Review creates one reusable source card for the panorama. It never invents a guess, distance, score, or grade. Repeated clicks do not create duplicate source cards. Saving a visual clue creates this source card automatically, so a second action is unnecessary.

### Environment and sampling

Environment can request Mixed, Urban, Suburban, or Rural locations. Urban level adjusts how strongly city-centre proximity is favoured. Natural sampling follows the available distribution; Balanced sampling spreads practice more evenly across the selected countries.

These controls guide generation. A panorama can still differ from the requested setting when coverage is limited.

## Play mode

Play measures unaided recall in scored rounds. It supports short drills and longer games while keeping each round in History.

### Game setup

- Round count — choose 1 to 100 rounds.
- Collection — choose the country pool.
- Country mix — use the full collection, choose one target country, or add several commonly confused countries as a focused pool. Remove a flag pill to take a country back out.
- Environment — choose Mixed, Urban, Suburban, or Rural.
- Sampling — use Natural or Balanced selection.
- Timer — set a round limit or leave time unlimited.
- Compass — show or hide the selected compass style.
- AI Coach — allow or disable analysis for that game.

### Movement rules

- Standard — movement, panning, and zooming are available.
- No Move — the camera may rotate and zoom, but you cannot travel away from the starting panorama.
- NMPZ — no movement, panning, or zooming.

Movable games reject isolated panoramas that cannot support the chosen rule. This may make location search take longer.

### Making a guess

Place the marker on the map and submit it. The round result shows the actual location, distance, score, and answer context. A timer reaching zero submits according to the active game flow.

Submitting a Play answer saves the current Street View image with that location for later coverage and history previews. This does not create a clue unless you explicitly save one.

### Scoring and mistakes

Pinpoint score falls as distance grows. Country correctness is also considered when GeoTrainer decides whether an attempt is weak enough to schedule. Strictness changes the threshold, so the same result can be acceptable for a beginner and weak for a pro.

### Game summaries

Completed and interrupted games remain in Past Games. A summary preserves round order, scores, times, rules, and locations. Mistake practice can start a correction session from weak rounds without rewriting the game.

## Review mode

Review presents scheduled locations when they are due. It is a real recall test, not a slideshow of past answers.

### Before the guess

The panorama appears without answer metadata. Review does not receive or render the original answer, previous guessed country, score, or other spoilers before you submit.

### After the guess

The result compares your current pinpoint with the actual location and may show previous attempts for context. The new answer is stored as its own Review attempt.

### Automatic grading

GeoTrainer derives an internal grade from the current result. Country correctness, distance, score, response time, and strictness contribute to scheduling. You do not choose a manual grade.

### Completing a queue

Review continues through the active queue until no selected cards remain. Same-day relearning cards may return after their configured delay. Daily limits can leave additional due cards for a later session.

## Scheduling

### Strictness

- Beginner — rewards country-level recognition and tolerates wider pinpoint error.
- Balanced — the default compromise between country recognition and regional precision.
- Pro — expects stronger pinpoint results before an answer counts as secure.

Strictness affects future grading; it does not rewrite old attempts.

### Daily limits

New cards per day limits how many unseen review cards enter the queue. Maximum reviews per day limits the total due workload. Lower the new-card limit if the daily queue is growing faster than you can finish it.

### First review and relearning

First review days controls the initial delay for a newly scheduled location. Relearning minutes controls how soon a failed review can return on the same day. Easy first interval allows an exceptionally strong first answer to wait longer.

### Maximum interval

Maximum interval caps how far a mature location can be scheduled into the future. A shorter cap increases workload; a longer cap trusts strong memories for longer.

### Answer time

Maximum answer seconds helps distinguish fluent recall from a correct answer reached only after prolonged searching. It is a grading input, not necessarily a visible countdown.

### Due order and day boundary

Oldest due prioritizes the longest-waiting cards. Random mixes the due queue. The review reset time and timezone define when a new study day begins, which prevents midnight sessions from splitting unexpectedly.

## Custom practice

Custom practice is extra training built from filters such as weak countries, recent mistakes, unseen places, score ranges, or due locations.

### Scheduling rule

Custom practice never advances, renews, or postpones spaced-review intervals. It is safe for warmups, focused drills, and extra preparation because the due schedule remains authoritative.

### Mistake correction

After a game, correction practice can repeat weak rounds until they are answered successfully. These correction attempts remain separate evidence and do not alter the original Play records.

## AI Coach

AI Coach looks for visible geographic evidence in the current panorama. Guest users can use it without creating an account.

### Analyze

Analyze samples the panorama around you and evaluates the visible evidence together. If the full panorama cannot be sampled, Coach falls back to the current view. Moving along the same location or revealing the answer keeps earlier observations in the same analysis, so another Analyze adds evidence instead of starting over.

### Before and after reveal

Before a guess, Coach responses are spoiler-safe and do not receive answer metadata. After a Study reveal or submitted guess, answer context may support explanation and comparison.

### Reliability

Treat Coach output as a hypothesis. Prefer multiple independent clues, notice contradictions, and lower confidence when evidence is weak. Service errors do not block Study, Play, or Review.

## Saved clues

Useful Coach analysis can be saved with its clue image and notes. Saved clues help build a personal reference for countries and clue families. Open Clues from the main navigation to search the library, browse it by country, inspect confidence summaries, open full clue details, or start country practice.

### Good clue notes

- Describe the visible object precisely.
- Explain why it supports a place instead of merely naming the answer.
- Record common confusions and limitations.
- Keep confidence proportional to the evidence.

### Managing clues

Saved clues can be opened for full detail and removed when they are misleading or redundant. Removing a clue does not delete the underlying panorama, visits, or attempts.

The full-detail view includes the saved image, interactive Street View, country probabilities, evidence, limitations, contradictions, and suggested next checks. Location links open the corresponding panorama in Google Maps.

## Collections and location generation

### Built-in collections

Built-in collections provide convenient country pools. Their country and city datasets are local generation data, not proof that every seed or every road is available in Street View.

### Custom collections

Create a custom collection to practise a chosen country set repeatedly. Editing a collection changes future generation while preserving attempts and saved games that used the earlier selection.

### Coverage limitations

Street View availability changes over time. Panoramas may be removed, replaced, disconnected, or assigned unexpected metadata. GeoTrainer validates candidates and retries, but no generator can guarantee a panorama for every request.

## Preferences

Open Preferences from the settings control in the app header. Native dropdowns support keyboard type-ahead: focus a country, category, or collection menu and type the first letters to jump to a matching option.

### Language

Interface language changes buttons and navigation. Game language controls geographic labels. AI language controls Coach responses. These choices are independent and persist across reloads.

Supported languages are English, Spanish, Portuguese, French, German, Italian, Russian, and Swedish.

### Review

Review preferences include strictness, daily limits, first-review delay, relearning delay, easy interval, maximum interval, answer-time threshold, queue order, reset time, and timezone.

Start with Balanced defaults. Change one group at a time and observe the queue for several sessions before making another large adjustment.

### Display

Display preferences include Light or Dark palette, compass visibility, and compass style. Display choices do not affect scoring or scheduling.

## Progress and statistics

### Progress

Progress summarizes today and all-time activity, due reviews, countries encountered, attempts, and active study time. It is a workload and habit view, not a single mastery score.

### Performance

Statistics can compare Study, Play, and Review activity over selected periods. Country accuracy, average score, weak countries, and common confusions become more useful across longer windows than on a single day.

### AI-assisted rounds

Play attempts made with AI assistance are excluded from performance statistics by default. Enable the AI-assisted filter when you intentionally want to include them.

### Reading noisy data

One poor session does not prove regression. Look for repeated country confusions, consistently low scores, or a growing due backlog before changing how you study.

## Coverage and history

### Coverage map

Coverage shows panoramas you actually encountered in Study, Play, or Review. It never plots country or city seed points as if you had visited them.

Saving a Study location and submitting a Play answer also saves the current view for its coverage preview. Older locations without a saved view remain valid and still open in Street View.

Map layers can emphasize exposure, accuracy, average score, weakness, or due reviews. Clusters summarize nearby encountered locations.

### Geography table

The country table compares seen, played, reviewed, correct, wrong, average, best, last-seen, and clue information. Sort columns to find neglected or weak areas.

### History

History filters original visits, Play attempts, Review attempts, and saved games. Opening an item returns to its preserved context when the panorama remains available.

### Missing panoramas

If an original panorama is unavailable, GeoTrainer can attempt a coordinate fallback. The fallback is marked because it may not reproduce the exact imagery you originally saw.

## Cloud sync and accounts

An account is optional. Local training works without signing in.

### Signing in

Open the account entry on the homepage and use Google or email. Signing in identifies the account and starts quiet progress sync.

### What sync does

Cloud sync keeps compatible visits, attempts, review schedules, saved games, collections, preferences, and saved clues available across devices. When records conflict, the current device’s version wins while unique records from both sides are preserved.

### Working offline

The app can continue using locally available progress when offline. Network-dependent features such as new Street View loading, reverse geocoding, Coach analysis, and cloud sync may wait until connectivity returns.

### Signing out

Signing out disconnects cloud sync. It does not erase the progress already stored in the current browser.

## Data and recovery

### Local progress

Training history is kept in the browser. Clearing site data, using private browsing, or losing the device can remove local progress, so cloud sync is recommended when the history matters to you.

### Saved-game compatibility

Older saved games and optional fields use migration-safe defaults. A saved game keeps the rules and round records that existed when it was played.

### Non-destructive history

Review and correction create new records. They never repair a mistake by editing the original Play attempt, which keeps statistics and improvement comparisons honest.

## Keyboard and display

### Study shortcuts

Space advances the Study flow where shown. Reveal and next-location controls remain reachable without opening extra panels. Fullscreen can reduce surrounding interface when concentrating on imagery.

### Map and panorama controls

Standard browser and Google Maps keyboard behavior applies to supported controls. On touch devices, use gestures for panorama rotation, movement, zoom, and guess-map placement when the active game rules permit them.

### Accessibility

GeoTrainer supports keyboard-accessible controls, visible focus, reduced motion, responsive panels, and non-color-only result labels. Zoom the browser if the reading size is uncomfortable.

## Troubleshooting

### A panorama is blank or unavailable

Street View coverage can change. Move to the next location. In Review or History, a coordinate fallback may be offered when the original panorama no longer opens.

### Location search takes a long time

Narrow collections, strict environment filters, and movable-game connectivity checks reduce the number of valid candidates. Broaden the collection or environment and try again.

### The Review queue is empty

Play more rounds, save a Study location for Review, or wait until scheduled cards become due. Check daily limits and the configured review timezone if you expected cards today.

### The queue is too large

Finish due reviews before introducing more new locations. Lower New cards per day, keep Oldest due order, and work through the backlog in manageable daily sessions.

### AI Coach is unavailable

Continue training normally. Retry later, use the current-view analysis instead of 360°, or check network connectivity. Coach failure does not affect saved attempts or review scheduling.

### Progress looks out of date

Confirm that the intended account is connected, wait for sync to finish, and reload once. Signing into a different account produces a different cloud history.

### Google sign-in fails

Return to GeoTrainer and try again. A provider-disabled or redirect-mismatch error requires the deployed authentication configuration to be corrected; email sign-in remains an alternative when available.

### Layout or scrolling is stuck

Close the open panel with its close control or Escape, then reopen it. On a phone, keep the browser in portrait or landscape according to which gives the panorama and map enough space.

## Frequently asked questions

### Do I need an account?

No. Study, Play, Review, history, and guest AI Coach use work without an account. An account enables cloud sync across devices.

### Does Study affect my score?

No. Study is intentionally ungraded. Save for Review schedules a source location without inventing a result.

### Can I grade reviews manually?

No. GeoTrainer schedules from the geographic result so the grade remains consistent with the task.

### Does custom practice postpone a due card?

No. Extra practice does not change the spaced-review schedule.

### Why did the same country appear twice?

Sampling avoids immediate panorama duplicates, not all repeated countries. Repetition within a collection is expected and helps distinguish varied environments inside the same country.

### Is Coverage a map of every supported location?

No. It contains only panoramas you encountered. Generation datasets and unvisited seeds are never counted as coverage.

### Can AI Coach see the answer before I guess?

No answer metadata is supplied before a Play or Review guess. In Study, answer context becomes available only after Reveal.

### Why is a previous location slightly different?

Google may replace or remove a panorama. A coordinate fallback can open nearby imagery, but GeoTrainer marks it as a fallback rather than pretending it is identical.

## Learning resources

### Build evidence chains

Start broad, then narrow. Combine driving side, script, road design, terrain, vegetation, infrastructure, architecture, climate, and imagery traits. A conclusion supported by several independent clues is stronger than a single famous clue.

### Record contradictions

When evidence disagrees, write down the conflict. A correct country reached through weak reasoning is less valuable than an incorrect guess that reveals exactly which clue was misunderstood.

### Prefer understanding over memorizing labels

Learn why a clue varies by region, where it stops being reliable, and what it is commonly confused with. This makes the memory transferable to unfamiliar panoramas.

### Suggested practice sequence

1. Learn one clue family in Study.
2. Test it in a short Play game without Coach.
3. Review the resulting weak locations when due.
4. Inspect Statistics only after enough attempts exist to reveal a pattern.

### External reference libraries

- [Plonk It](https://www.plonkit.net/) — structured country guides that progress from identification to regional clues, spotlights, maps, and further resources.
- [GeoHints](https://geohints.com/) — a searchable visual catalog for bollards, road lines, plates, signs, utility poles, camera generations, driving side, landscapes, and other clue families.
- [GeoMetas](https://geometas.com/) — free country and regional meta lessons organized by clue category, with dynamic quizzes for recall practice.

External guides are community references. Check several clues together and allow for outdated imagery, regional exceptions, and Street View changes.
