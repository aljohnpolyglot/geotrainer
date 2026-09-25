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

A review card schedules a reusable location. Play mistakes can create cards automatically. Study can create one ungraded source card with Save for Review; it appears as a new card, not a no-guess or wrong-country attempt. Review answers add new attempts and update only the card’s schedule.

### Card states

- New — saved but not yet reviewed.
- Learning — recently introduced and still on short intervals.
- Relearning — returned to short intervals after a weak review.
- Young — established, with an interval shorter than 21 days.
- Mature — established, with an interval of at least 21 days.

### Collections

Collections limit the countries used for generation. Built-in collections cover broad geographic groupings. Custom collections let you choose a reusable set of countries without duplicating locations or history.

## How GeoTrainer complements GeoGuessr

[GeoGuessr](https://www.geoguessr.com/) is excellent for discovery, varied maps, solo challenges, multiplayer, and competition. GeoTrainer focuses on what happens between those games: turning encounters and mistakes into a durable learning plan.

A result tells you how one round went. GeoTrainer carries weak locations forward with ungraded Study, immutable attempt history, automatic spaced repetition, focused country-confusion drills, saved clues, and personal coverage. Use GeoGuessr to explore and compete; use GeoTrainer to unpack mistakes, target recurring confusion, and make what you noticed stick. It is a supplement, not a replacement.

## Study mode

Study is an ungraded first encounter. It is the right mode for observation, comparison, and learning new clue systems without score pressure.

Study differs from Review in intent: Study introduces or explores freely chosen places, while Review tests previously encountered places when their schedule says they are due. Study has no map guess or score.

### Study setup

Choose a collection or build a focused country mix, then choose the environment and sampling style. The country list follows the selected collection and starts at all countries. Add several commonly confused countries to alternate between them in either Study or Play.

Use the separate **Regions** and **Cities** dropdowns and remove selections with their pills. Regions are grouped by country; cities are grouped by region. With no region selected, the normal country-wide pool applies. With no city selected in a region, all its available cities are included; selecting cities narrows only that region. Removing a region also removes its city selections; removing its last city restores all its available cities. After adding countries, you may add region and city pools as removable pills. Regions are alphabetical; cities default to importance by population and can be switched to alphabetical order. A region’s **All available cities** entry samples its bundled city seeds, while a city entry targets that city’s surrounding Street View coverage. These are city-centred pools, not complete administrative polygons, so **All available cities** does not promise every road or rural area in the region. Starting a new Learn setup after leaving a focused session restores World and an unrestricted country list; Resume keeps the saved session. Least exposure first searches its target before widening locally. If Mixed searches miss coverage, retries use country coverage seeds while retaining the country, imagery, indoor, movement, and recent-location filters. The search keeps trying at a paced rate until it finds a match or you leave or change the setup; coverage at an exact target is not guaranteed.

The **Indoor coverage** dropdown defaults to **Outdoors only**. Choose **Mixed indoors and outdoors** to allow either kind when Google has it. Google Street View has no reliable indoor-only search, so this choice does not promise an indoor panorama. It affects newly generated Custom Learn locations and panorama choices in Explore Map, not Uploaded map, Meta, saved places, or Review.

Learn offers four paths: Custom, Meta, Explore Map, and Uploaded map. For Uploaded map, select a Map Maker or GeoGuessr JSON export. A plain list of locations or a map with `customCoordinates` is accepted; each usable entry needs numeric latitude and longitude, while `panoId` and `heading` keep its exact view when available. Invalid entries are skipped. The file must be under 10 MB and contain at least one valid location. **Location variation** runs from 0 to 100: 0 opens the uploaded panorama or its coordinate exactly, while higher values search for nearby Street View imagery up to 1 km away at 100. If no nearby imagery opens, the app uses an original map location. This applies only to Uploaded map Learn; uploaded Play rounds use the original map locations. Choose **Start learning** to sample that map. **Previous** sits before Reveal and becomes available after you visit a second location; **Next** moves forward through places visited in this session before drawing another. The **X** on the right of the Learn header opens setup to choose another path. A completed uploaded-map run stops at its final unique panorama.

### Choosing a learning priority

Uploaded-map Learn labels source progress (for example, **Source: 1/50**). Each uploaded source entry is marked done when checked, so **Next** cannot draw it again even if nearby variation resolves to another panorama; broken entries are also skipped once. **Next** disappears when the source is complete, leaving **Previous**. Uploaded Play likewise avoids repeating source entries and limits the round count to the map’s location count. In Explore Map, search for a city, region, or country and choose a suggestion from GeoTrainer’s built-in catalog to zoom there. Suggestions only move the coverage map; click blue coverage to open Street View. Personal Notebook text is limited to 1,000 characters per save; the counter beneath the editor shows the remaining capacity.

Priority changes how **new Custom Learn locations** are chosen after the collection, country mix, environment, imagery source, and indoor filters are applied. It does not change Uploaded map, Meta, Explore Map, Play, or Review.

- **Random** (default) samples the eligible pool without using your history. Use it for variety or an unbiased tour of the selected collection.
- **Familiar places** chooses a previously encountered eligible location as an anchor and searches roughly 1–12 km around it. Use it to learn the surroundings and recognize nearby views rather than repeat the exact panorama.
- **Least exposure** first chooses an unseen or least-encountered eligible country, fills bundled regions that are still grey on Coverage, then targets the largest remaining geographic blind spot. Country-size normalization keeps large countries from winning every tie. This regional pass also applies to one-country collections; regions without a usable local seed fall back to the country-wide gap search.

When no eligible history exists, Familiar places and Least exposure begin from the selected pool like Random. In a multi-country Least exposure search, GeoTrainer tries the chosen grey or least-exposed country and its regional target first. Every unsuccessful lookup, including a panorama identified outside the requested country, advances immediately. After one unseen target misses, countries with proven encounter coverage are tried from least to most exposure before more unknown countries; equal ties are shuffled. The order repeats until a panorama is found or you leave. Street View coverage and the active filters still decide whether a requested area can produce a panorama, so a nearby available view may be used when the exact target has no coverage.

For World Least exposure, a bundled coverage scan skips countries whose included seeds found no navigable official panorama. Focused country pools still search every selected country.

Uploaded map files stay on this device. Progress from locations you study or play can still appear in your account. To use the same map on another device, upload the file there and start a new session. A removed or unavailable Street View panorama may be skipped; if no usable panoramas remain, upload another map or change learning paths.

### Studying a panorama

1. Scan the whole scene before zooming into one object.
2. Separate observations from conclusions: record what you see before deciding what it means.
3. Build a shortlist from several clues that agree.
4. Use Reveal only after you have made a private commitment.
5. Move to the next panorama or save the location for Review.

### Reveal

Reveal shows the exact location information for the current Study panorama. Until you reveal it, answer metadata stays hidden. Hiding the answer again does not turn the visit into a scored attempt.

### Save for Review

Save for Review creates one reusable source card for the panorama. It never invents a guess, distance, score, or grade. The current panorama stays open after saving; use Next when you are ready to move on. Repeated clicks do not create duplicate source cards, and the saved state is restored after a reload. Saving a visual clue creates this source card automatically, so a second action is unnecessary.

### Environment and sampling

Environment can request Mixed, Urban, Suburban, or Rural locations. Urban level adjusts how strongly city-centre proximity is favoured. Natural sampling follows the available distribution; Balanced sampling spreads practice more evenly across the selected countries.

These controls guide generation. A panorama can still differ from the requested setting when coverage is limited.

## Play mode

Play measures unaided recall in scored rounds. It supports short drills and longer games while keeping each round in History.

### Game setup

- Location source — choose Generated locations for the usual collection and environment controls, or Uploaded map to select a Map Maker JSON file. Uploaded games draw unique rounds from that file, keep its name in Past Games, and cap the round count at the number of uploaded locations.
- Round count — choose 1 to 100 rounds.
- Collection — choose the country pool.
- Country mix — use the full collection, choose one target country, or add several commonly confused countries as a focused pool. Remove a flag pill to take a country back out.
- Environment — choose Any environment to remove the filter, or limit generation to Urban, Suburban, or Rural scenes.
- Indoor coverage — choose Outdoors only (default) or Mixed indoors and outdoors for newly generated rounds. Uploaded maps keep their listed panoramas.
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

Place the marker on the map and submit it. On phones, the Precision place control floats above the bottom of the visible screen; tap it to open the guess map without scrolling. The round result shows the actual location, distance, score, and answer context. A timer reaching zero submits according to the active game flow.

Submitting a Play answer saves the current Street View image with that location for later coverage and history previews. This does not create a clue unless you explicitly save one.

### Scoring and mistakes

Pinpoint score falls as distance grows. Country correctness is also considered when GeoTrainer decides whether an attempt is weak enough to schedule. Strictness changes the threshold, so the same result can be acceptable for a beginner and weak for a pro.

### Game summaries

Completed and interrupted games remain in Past Games. A summary preserves round order, scores, times, rules, and locations. Mistake practice can start a correction session from weak rounds without rewriting the game.

## Review mode

Review presents scheduled locations when they are due. It is a real recall test, not a slideshow of past answers.

### Before the guess

The panorama appears without the current card’s persisted answer metadata. Review does not receive the original answer, previous guessed country, or score before you submit. If an old panorama ID now resolves more than 10 km from its saved answer, Review uses nearby imagery at the saved coordinates instead of showing the wrong scene; if no valid replacement exists, the card does not open. All learning tools remain available, and anything you deliberately open—including saved note text, Meta explanations, Coach candidates, and probabilities—is shown in full. The Review header shows your current card, remaining cards, and when session progress is saved; reloading restores the completed-card count instead of restarting the display at card one.

### After the guess

The result compares your current pinpoint with the actual location and may show previous attempts for context. It also reveals the available city, region, road, formatted address, and exact coordinates, matching the location details shown after Reveal in Learn. Minimize the result from its top-right corner to study the panorama, then use View result to reopen it. On phones, Review progress stays in the top bar and the result panel keeps Next review visible as you scroll its details. The new answer is stored as its own Review attempt. Coach, Meta, saved clues, Notebook, and Available notes remain accessible until you choose Next review.

The result map keeps the answer centered in green, then zooms out enough to show today’s guess in red and every saved prior guess with coordinates in blue. The selected result-map zoom remains the closest allowed scale. The grade and next queue are saved before the result appears, so reloading after a passed result continues to the next card rather than reopening it unanswered.

### Automatic grading

GeoTrainer derives an internal grade from the current result. Country correctness, distance, score, response time, and strictness contribute to scheduling. You do not choose a manual grade.

### Completing a queue

Review continues through the active queue until no selected cards remain. Same-day relearning cards may return after their configured delay. If due cards are being held back, Review says the daily limit was reached instead of claiming all reviews are complete.

## Scheduling

### Strictness

- Beginner — rewards country-level recognition and tolerates wider pinpoint error.
- Balanced — the default compromise between country recognition and regional precision.
- Pro — expects stronger pinpoint results before an answer counts as secure.

Strictness affects future grading; it does not rewrite old attempts.

### Daily limits

**New cards per day** limits cards that have never been reviewed. **Maximum reviews per day** caps the entire ready queue, including new and previously reviewed cards. Both limits apply at the same time. For example, with 50 new cards and 500 maximum reviews, 110 cards can be due while only 108 are ready if two of the due cards exceed the new-card allowance. Home and Review show the actionable ready count; Review separately reports cards held by daily limits. Raising the total limit does not bypass the new-card limit. Fresh profiles default to 50 new cards and 500 total reviews per day; saved choices remain unchanged.

A card counts against the new-card limit only until its first completed Review. Reviews already completed during the current review day reduce the remaining total allowance. Locations within 50 metres in the same country share one Review card, including cards created by Save for Review, Notebook, Coach, or Play.

### First review and relearning

First review days controls the initial delay for a newly scheduled location. Relearning minutes controls how soon a failed review can return on the same day. Easy first interval allows an exceptionally strong first answer to wait longer.

### Maximum interval

Maximum interval caps how far a mature location can be scheduled into the future. A shorter cap increases workload; a longer cap trusts strong memories for longer.

### Answer time

Maximum answer seconds helps distinguish fluent recall from a correct answer reached only after prolonged searching. It is a grading input, not necessarily a visible countdown.

### Review view variation

Vary review view keeps one canonical card and schedule but may change its heading or use a nearby panorama as the location becomes well learned. Variation difficulty controls how aggressively mature cards vary; 0 always uses the original view. New, weak, or recently failed cards stay close to the anchor. A failed varied view makes later variation more conservative, and lookup failure falls back to the saved view without creating a duplicate card.

### Due order and day boundary

Oldest due prioritizes the longest-waiting cards. Random mixes the due queue. The review reset time and timezone define when a new study day begins, which prevents midnight sessions from splitting unexpectedly. Choose the timezone from the dropdown or use automatic detection. Preferences shows the actual next scheduled review as both a local date and the remaining hours and minutes.

Use **Save** to apply changes. Strictness and interval settings affect later grading and scheduling; they do not rewrite saved attempts. Daily-limit and order changes affect the next queue calculation immediately.

## Custom practice

Custom practice is extra training built from filters such as weak countries, recent mistakes, unseen places, score ranges, or due locations.

### Scheduling rule

Custom practice leaves future cards unchanged. If a card is already due, completing it advances the schedule so it does not remain due after reload.

### Mistake correction

After a game, Practice mistakes opens Review and repeats weak rounds until they are answered successfully. It appears only when that saved game still has eligible attempt records. Each weak Play location remains a new review card, while correction attempts are saved separately and never alter the original Play records.

## AI Coach

AI Coach looks for visible geographic evidence in the current panorama. Guest users can use it without creating an account.

Before reveal, a high-confidence analysis can add a “Most likely in” region, city, quarter, landmark, or exact-place estimate after the country ranking, but only when multiple strong visible clues support that narrower location. Generic scenes keep the estimate hidden.

Play uses the same learning toolbar as Study: Notebook, the nearby Available notes count, and AI Coach when enabled in the game setup.

Coach waits for the saved AI language before analysis, localizes candidate country names, rejects substantially mixed-language results, and retries vague country reasoning that merely says the scene is “consistent with,” “similar to,” “common in,” or “typical of” a country without a concrete distinguishing feature.

### Analyze

Analyze samples the panorama around you and evaluates the visible evidence together. If the full panorama cannot be sampled, Coach falls back to the current view. Moving along the same location or revealing the answer keeps earlier observations in the same analysis, so another Analyze adds evidence instead of starting over.

### Print Screen, paste, and analyze a clue

1. Frame the visual clue, then press **PrtScn** or **Windows + Shift + S** to copy a screenshot.
2. Open **AI Coach → Known clues**, select the clue box, and press **Ctrl + V** (or **Command + V** on macOS).
3. Check the preview, then choose **Analyze clue**.
4. GeoTrainer analyzes the pasted image and automatically saves the image, evidence, and learning note in **Clues**. The full analysis remains accessible during Review.

When the crop has one obvious foreground subject, Coach analyzes that object first and uses the surroundings as supporting or contradictory context. Unreadable details remain explicitly uncertain.

### Use an external AI answer in Notebook

1. Capture or copy the clue image.
2. Open Gemini or another external Google AI surface and attach or paste the image.
3. Start with: **“You are a GeoGuessr coach.”** Ask it to explain the visible evidence, main confusers, and the clue that would distinguish them.
4. Copy the answer, open **Notebook**, and paste it into the note field.
5. Save the note for Review.

Notebook preserves pasted headings, bold emphasis, and bullet lists. External answers are not automatically verified, so keep unreadable details uncertain and check every claim against what is actually visible.

### Before and after reveal

Before a guess, Coach does not receive the current card’s persisted answer metadata, but its full visible-evidence analysis and country candidates remain available. A region, city, landmark, or exact-place estimate appears only when multiple strong visible clues support it. After a Study reveal or submitted guess, **Analyze** becomes **Explain**: Coach compares the image with the answer, uses only that country’s reference hints, and says plainly when the image was not sufficient to identify it.

### Reliability

Treat Coach output as a hypothesis. Prefer multiple independent clues, notice contradictions, and lower confidence when evidence is weak. Service errors do not block Study, Play, or Review.

## Saved clues

Every completed Coach analysis is saved after its write finishes and appears in Available notes and My Clues with the current analyzed frame. Additional 360° views remain transient. Older text-only records remain valid. Rapid Coach completions are serialized so one cannot overwrite another. Saved clues help build a personal reference for countries and clue families. Open Clues from the main navigation to search the library, filter by country, inspect confidence summaries, open full clue details, or start country practice. Country options show clue totals and are ordered from most clues to least; × clears the filter. Back from a detail returns directly to the library.

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

Display preferences include Light or Dark palette, compass visibility, compass style, optional sound effects, and optional ambient music. During Learn and Review, the compass switch sits with the other panorama learning tools. Sound and music start disabled, have separate saved volumes, and music begins only after you interact with the page.

Under **Maps**, choose a **Map color palette** of Auto, Light, or Dark. Auto follows the app appearance; Light and Dark keep that map palette even when the app theme differs. Choose **Result map zoom** to open revealed result maps at Closest, Country, Country region, or World scale; Country is the default. This applies to Learn, pinpointing, Review, results, and summaries. Satellite imagery keeps its own colors. Country borders are shown by default and can be turned off; they appear only where a national boundary is in the visible map area. Border width and color are adjustable with a live preview; regional borders are off by default and can be enabled separately.

## Progress and statistics

Learn saves are ungraded sources, so they appear as Study activity and new Review cards—not as “No guess” attempts or zero scores. Reloading a paused Study workspace resumes its current visit rather than adding another Study row.

### Progress

Progress summarizes today and all-time activity, due reviews, countries encountered, attempts, and foreground training time across Study, active Play, and active Review—including time spent moving through panoramas and using learning aids. Active time is saved when you switch sections or return Home; sessions with no Study visit, Play attempt, or Review attempt remain excluded. On a touch screen, tap a **Future due** bar to see its date and number of reviews. The homepage Known clues counter matches My Clues by totaling Personal, AI-assisted, and explicitly saved Meta entries without counting a Notebook image twice. It is a workload and habit view, not a single mastery score.

### Performance

Performance, Geography, Progress, and Confusions combine canonical Play and Review attempts over the selected period; the AI-assisted checkbox affects Play only. Hidden or closed time does not increase new Play or Review answer durations. On mobile, swipe the section tabs and wide tables horizontally; the page stays in Statistics while those rows scroll. Country accuracy, average score, weak countries, and common confusions become more useful across longer windows than on a single day.

Review improvement history shows the newest 10 entries first. Sessions and each History tab also show 10 entries per page. Use Previous and Next beneath each list to move through older results; changing a History tab or filter returns to page one.

### AI-assisted rounds

Play attempts made with AI assistance are included in performance statistics by default. Clear the visible AI-assisted checkbox when you want an unassisted-only view. Review summaries compare the previous average with today’s average and classify results as improved, unchanged, or worse; the 12-week activity calendar colors days by completed-review intensity.

### Reading noisy data

One poor session does not prove regression. Look for repeated country confusions, consistently low scores, or a growing due backlog before changing how you study.

## Coverage and history

### Coverage map

Coverage shows panoramas you actually encountered in Study, Play, or Review. It never plots country or city seed points as if you had visited them.

Saving a Study location and submitting a Play answer also saves the current view for its coverage preview. Older locations without a saved view remain valid and still open in Street View. An opened Coverage panorama includes AI Coach, Notebook, linked Meta, and Available notes; saving there creates or reuses its Review card.

Map layers can emphasize exposure, accuracy, average score, weakness, due reviews, or mastery. Clusters summarize nearby encountered locations. A detailed SVG country heatmap applies the same selected layer to country shapes; choose its warm, blue, green, or purple palette without changing the data. Drag the heatmap and use the mouse wheel, slider, or zoom buttons to explore it. Click a country to open its regional heatmap. Regional colors use the same selected layer and assign encountered places to regions using saved location details or Google Maps geocoding when opened. Some countries have no regional map in the bundled data, and locations whose region cannot be identified remain unshaded. On Exposure, hover a country for its exact encounter count. The neutral map color means not encountered, no scored attempts, or no Review history according to the selected layer; it does not describe Google Maps availability.

Once opened, embedded result, Explore, Coverage, and Statistics maps remain warm while their panel or tab is hidden, so reopening does not initialize the same map again. Map tiles use the browser and Google Maps cache; GeoTrainer does not persist map or Street View imagery locally.

### Geography table

The country table compares seen, played, reviewed, correct, wrong, average, best, last-seen, and clue information. Sort columns to find neglected or weak areas.

### History

History filters original visits, Play attempts, Review attempts, and saved games. Each tab shows 10 entries per page and returns to the first page when its filters change. Opening an item returns to its preserved context when the panorama remains available.

### Missing panoramas

If an original panorama is unavailable, GeoTrainer can attempt a coordinate fallback. The fallback is marked because it may not reproduce the exact imagery you originally saw.

## Cloud sync and accounts

An account is optional. Local training works without signing in.

### Signing in

Open the account entry on the homepage and use Google or email. Signing in identifies the account but does not transfer progress until you select **Sync now**.

### What sync does

Study, Play, and Review progress is always saved to this browser first. Cloud sync is manual: open the account entry and select **Sync now** on each device when you want to exchange progress. One sync downloads the latest cloud backup, combines compatible visits, attempts, new cards, review schedules, grading history, saved games, collections, preferences, paused workspaces, and saved clues, applies that merged copy locally, caches missing private clue images in this browser, then uploads the merged backup. The account panel reports each phase and retains a receipt with downloaded, local, merged, added, cached-image, Review-update, Review-event, and upload counts; a toast confirms completion. Opening Clues, Available notes, Coverage, or history uses the local cache and does not contact cloud storage. The most recently graded Review schedule wins while grading events and unique records from every device are retained. Signing in, saving, focusing, reconnecting, backgrounding, and opening the app do not transfer progress. For several devices, sync the device containing work that is not yet in the cloud first, then sync the others. Signed-out localhost and deployed-site data remain separate.

**Sync & backup** also provides **Export** and **Import** without requiring cloud access. Export downloads one `.geotrainer` file containing the complete local database and cached saved photos. Import validates the file and merges only missing or newer information without erasing current-device progress. Files record the exporting account ID; importing under another account or while signed out requires confirmation. Keep exported files private, then copy them through Drive, OneDrive, USB, or another trusted location.

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

### Street View controls appear over a black screen

If the compass, arrows, or Google label appear but the panorama stays completely black, test Street View in Google Maps in the same browser. If it is black there too, open GeoTrainer in a private window with extensions disabled, toggle the browser's graphics acceleration setting, and relaunch it. Update the browser and graphics driver if needed. If Google Maps works but GeoTrainer stays black, reload GeoTrainer once and include your browser, device, and enabled extensions when reporting the problem.

### Location search takes a long time

Narrow collections, strict environment filters, and movable-game connectivity checks reduce the number of valid candidates. Broaden the collection or environment and try again.

### The Review queue is empty

Play more rounds, save a Study location for Review, or wait until scheduled cards become due. Check daily limits and the configured review timezone if you expected cards today.

### The queue is too large

Finish due reviews before introducing more new locations. Lower New cards per day, keep Oldest due order, and work through the backlog in manageable daily sessions.

### AI Coach is unavailable

Continue training normally. Retry later, use the current-view analysis instead of 360°, or check network connectivity. Coach failure does not affect saved attempts or review scheduling.

### Progress looks out of date

Confirm that the intended account is connected, select **Sync now**, and wait for it to finish. Then select **Sync now** on the other device. Signing into a different account produces a different cloud history.

### Google sign-in fails

Return to GeoTrainer and try again. A provider-disabled or redirect-mismatch error requires the deployed authentication configuration to be corrected; email sign-in remains an alternative when available.

### Layout or scrolling is stuck

Close the open panel with its close control or Escape, then reopen it. On a phone, keep the browser in portrait or landscape according to which gives the panorama and map enough space.

## Suggestions and bug reports

Email [mogatas.princealjohn.05082003@gmail.com](mailto:mogatas.princealjohn.05082003@gmail.com) with suggestions or bug reports. For bugs, include your browser, device, what you were doing, and a screenshot when possible.

## Frequently asked questions

### Do I need an account?

No. Study, Play, Review, history, and guest AI Coach use work without an account. An account enables cloud sync across devices.

### Does Study affect my score?

No. Study is intentionally ungraded. Save for Review schedules a source location without inventing a result.

### Can I grade reviews manually?

No. GeoTrainer schedules from the geographic result so the grade remains consistent with the task.

### Does custom practice postpone a due card?

No. Future cards stay unchanged; completing an already-due card advances its schedule normally.

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
- [Learnable Meta](https://learnablemeta.com/) — GeoGuessr learning maps plus documentation and map-making resources.

External guides are community references. Check several clues together and allow for outdated imagery, regional exceptions, and Street View changes.

## Learn, Meta, and Notebook

Pasted, uploaded, and captured Notebook images can be cropped before analysis or saving. Use the edit control in the image preview’s lower-right corner; drag the crop area or its corner handles, then apply the crop.

The **360° camera** in the workspace copies four directions from the current panorama as one image. A status toast confirms capture progress and whether the copy succeeded. The image goes directly to your clipboard and is not saved in GeoTrainer.

Learn has four paths. **Custom** keeps the familiar collection and environment flow. **Meta** opens guided clue lessons at their recorded panorama and heading. **Uploaded map** samples places from a Map Maker JSON file with optional location variation. **Explore Map** shows Street View coverage; click a covered road to enter that panorama. Its bottom-left filters choose official, mixed, or contributor imagery and outdoor-only or mixed indoor/outdoor coverage. Meta and Explore Map use Reveal to toggle the normal location card, where Save for Review schedules later pinpoint practice. In Explore Map, click blue coverage inside that card's map to move to another panorama; the card map keeps its current zoom and position. If Official only has no match, the message tells you to choose **Official + contributor** below; it never changes that filter for you. A globe button at the panorama's upper-left returns to the world map without occupying the main header. Reveal and Next stay at the bottom of the visible viewport, including fullscreen, while mobile learning tools form a side rail below the map controls. The revealed location card can be dragged, minimized with the minus button, or maximized to fill the viewport; its embedded map also has Google's fullscreen control. The Play and Review guess map's maximize button fills the viewport. Custom Learn and Play default to official Google imagery; the imagery selector can instead mix official and contributor panoramas or request contributor-only coverage. **Indoor coverage** defaults to Outdoors only; Mixed may include indoor and outdoor panoramas in generated Custom Learn and Play. In **Settings → Display**, panorama controls can show road labels or image dates, enable phone motion viewing, and choose click-and-arrow or arrow-only movement. Map controls choose road, satellite, hybrid, or terrain views, touch behavior, clickable places, and Auto, Light, or Dark map colors. Road labels and clickable places default to off to reduce accidental clues.

In a Meta lesson, use the top-right lightbulb to toggle the explanation. The first-use advice can be dismissed once or hidden permanently without removing lessons. A Meta appears in **My Clues** only after you explicitly save its location for Review. In Review, Meta remains fully accessible before and after the guess.

The top-right **Notebook** stores any number of personal notes for the current panorama. Choose an optional clue category, add optional text, or save with both empty simply to remember the place. You can also paste or upload a reference image and analyze it with Coach. Personal, AI-assisted, and Meta entries open in detail views with Street View and an overlaid saved/reference image when available. A saved visual clue’s detail view lets you add or edit its Notebook text, save it, and open the saved image full screen. Exact repeated images are collapsed only when their note or description is also identical or blank; the same image remains separate when its meaningful text differs. The numbered **Available notes** button opens the full history for that panorama and same-country Street View nodes within 50 metres in one continuous scroll area; new Coach analyses enter it immediately and do not reopen as the active Coach result after reload. Explicitly saved notes and images create or reuse the same Review source. My Clues can filter **Personal**, **AI-assisted**, and **Meta lessons**, then paginates matching entries 20 at a time. During Review, saved note text, analyses, candidates, and probabilities remain visible before and after the guess.

Each Available notes entry has a subtle trash action. Entries sharing the same normalized caption or exact image collapse automatically, keeping the richest image-and-description version.

Each Notebook save remains an independent entry, even at the same panorama. If a submitted photo cannot be loaded, the note remains visible and is marked for recovery.

A low Review result automatically returns that location to the end of the current session. It continues returning until you pass it; each try remains a separate attempt.

Meta Study contains 359 locally hosted lessons normalized from the paired OpenGuessr capture and additional GeoMetas examples with usable Street View coordinates. Meta explanations follow the interface language in English, Spanish, Portuguese, French, German, Italian, Russian, and Swedish. Using AI Coach or explicitly saving a Notebook entry automatically creates or reuses the location’s Review card; otherwise the revealed location card keeps its Save for Review action. **Available notes** contains only Personal and AI-assisted history, including full analysis details, exact timestamps, and the submitted screenshot when one exists; Meta remains under its own lightbulb. Coach waits for the saved language preference and requests every natural-language response value in the selected AI language. Finalized Personal and AI-assisted text stays in its creation language. Reviewing an already-due card advances its schedule even when opened through custom practice, and the completed state persists after reload.

Meta Learn selects unfinished lessons only. After all 359 are completed, its Learn option is greyed out and cannot be selected.

Leaving an unfinished Learn or Play session preserves it. The next entry offers **Resume**, **Start new**, or **Back**. Coverage includes a continuous **Mastery** heat layer: repeated successful reviews and long intervals gradually brighten countries and individual locations, while lapses reduce intensity. Meta lessons based on camera generation, Google vehicles, coverage, rifts, trekkers, or other imagery artifacts show a warning because later Street View updates can make them outdated.
