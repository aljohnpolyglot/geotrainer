# Changelog

## 2026-09-23

- Made Official Learn and Play searches ask Google directly for official panoramas instead of repeatedly receiving and rejecting nearby contributor imagery.
- Added a browser-authorized coverage training scan and used its bundled results to skip zero-hit countries only in World Least exposure; focused country pools remain unchanged.
- Marked checked Uploaded-map source entries complete so Next cannot draw them again, including with location variation, and labeled the header counter as Source progress.
- Plotted every saved prior guess as a blue marker on the Review result map and persisted a completed grade before showing the result, so reloading cannot reopen a passed card as unanswered.

## 2026-09-22

- Fixed phone-to-PC Review syncing by flushing pending progress when the app is backgrounded and combining grading history from both devices without rolling back the newest schedule.
- Added a top-right minimize control to Review results and a compact View result action so the panorama remains available for study before continuing.
- Restyled Explore Map place suggestions as an accessible themed search list, centered the search field, and removed the duplicate Learn exit button while the map picker is open.
- Reduced production location-generation logs to a concise country-mismatch warning without coordinates or panorama identifiers, and documented the required private clue-image migration for Supabase deployments.
- Sped up World Least exposure searches by randomizing countries tied at the same exposure level instead of crawling long alphabetical runs with sparse Street View coverage.
- Made multi-country Least exposure try one unseen target, then fall back immediately to the learner’s least-encountered countries with proven coverage before testing more unknown countries.
- Fixed World and other multi-country Least exposure searches lingering on sparse countries; every unsuccessful lookup now advances to the next country in exposure order.

## 2026-09-20

- Added the standard status toast while the workspace 360° screenshot is being captured, copied, or fails.
- Reduced the crop dialog footer to compact, accessible icon controls.
- Added the same confirmation toast when visual clues and Notebook notes finish saving.
- Kept the current Learn panorama open after Save for Review; moving to the next location is now always an explicit action.
- Fixed multi-country Least exposure searches getting trapped on one sparse target; they now try its least-exposed region first, immediately skip confirmed border mismatches, and quickly cycle through the remaining countries from least to most exposure until a panorama is found or the learner leaves. Kosovo can recover its code when Google omits it, while sparse-seed microstates use tight local searches instead of coarse country bounds.
- Made Least exposure fill unvisited local regions before revisiting represented regions, including in single-country Learn pools.
- Kept Learn and Play panorama searches retrying until success or cancellation, and increased country-border contrast on Google and Coverage maps.
- Fixed Available notes duplicate cleanup when identical cloud images use different signed URLs.
- Added editable saved-clue notes, full-screen clue images, sync-safe clue deletion, exact image/text duplicate cleanup, and hours/minutes activity totals on Home; removed the photo-recovery summary warning.
- Added a full-screen saved-image viewer from clue thumbnails, with backdrop, Escape, and mobile-safe close controls.
- Added consistent detail and Street View location actions to every My Clues entry that has a saved panorama, plus persisted-view thumbnails for legacy 360° Coach analyses.
- Aligned statistics country counts to the far right of each row, with arrows in a separate action column.
- Added subtle in-place deletion to Available notes and automatic collapsing of image-only, caption-only, and richer duplicate variants.
- Replaced Explore Map's Google-powered place autocomplete and geocoding with suggestions from the bundled city and country catalog.
- Added a responsive Notebook image cropper from the preview’s lower-right edit control, and replaced the fictional border diagram with a live Google map preview.
- Moved uploaded Learn progress into the header beside Review progress, and kept Least exposure focused on its geographic target while widening to nearby available Street View coverage.

## 2026-09-19

- Made a whole-region selection replace its individual city selections and added the missing Canadian province and territory Coverage map.
- Split region and city selection into separate dropdowns and removable pills in Learn and Play. Empty selections restore country-wide or region-wide defaults.
- Reset temporary Learn country pools when opening a new setup, fixing World showing only Germany after leaving a focused session.
- Start least-exposure searches at their target before widening locally, restore coverage-seed retries for Mixed environments, and translate the panorama lookup failure message.
- Added optional region and city pool pills beneath focused countries in Learn and Play, with alphabetical regions, population or alphabetical city ordering, and lazy local data for 31,491 cities across 2,790 regional pools.
- Matched Statistics' due-now count and today's due bar to the daily-limited Review queue.
- Added the revealed city, region, road, and formatted address to Review results alongside the exact coordinates.
- Added uploaded-map Learn progress, session-wide no-repeat traversal, Previous-only completion, and unique uploaded Play rounds capped to the map size.
- Added city, region, and country autocomplete with automatic zoom to Explore Map.
- Limited new Personal Notebook text to 1,000 characters with a visible counter and storage-level enforcement.
- Added the missing local Australia state and territory Coverage map.
- Kept least-exposure targets on verified in-country seeds so target-weakness practice no longer wastes retries on bounding-box ocean points.

## 2026-09-18

- Added Learn priority modes for random practice, familiar nearby places, and least-exposed geographic blind spots across single-country, mixed-country, continent, and world collections.
- Changed country Exposure heatmap colors to a fixed progression so the currently most-visited country is not automatically shown at maximum intensity.
- Added clickable country heatmaps that open lazily loaded regional maps, use saved or Google-resolved regions, show region and city names on hover, and include US states.
- Added Google Maps-style heatmap panning, wheel zoom, touch pinch zoom, a vertical zoom slider, contained page scrolling, and mobile-sized controls.
- Kept regional maps hidden behind a loading skeleton until location matching completes, stopped repeated modal reloads, and used a fixed exposure scale so one visit is not shown at maximum intensity.
- Replaced active Play and Review exit actions with the same right-side X pattern used by Learn.
- Reduced enabled country-border stroke weights so Thin stays subtle even at World scale, and hid regional borders by default to prevent stacked boundary lines.
- Added Settings → Display → Maps controls for country-border width and color plus a separate Regional borders switch.
- Added a live Google-map-style border preview in Maps settings before changes are saved.
- Added a Result map zoom setting with Closest, Country, Country region, and World presets; Country is the default so revealed maps do not open at street level.
- Matched the maximized Learn location card to the compact Pinpoint map size instead of filling the entire viewport.
- Kept the compact maximized Learn location card anchored to the left instead of moving it across the screen.
- Fixed Known clues modal rows without images so note text uses the full width and action buttons stay together at the top; on phones, clue details stack below any image and the list fills the screen.
- Added a 0–100 nearby-location slider to Uploaded map Learn, with exact placement at 0 and up to 1 km variation at 100; paused Learn sessions retain the setting.
- Made the revealed Learn location card's minus and maximize controls distinct, and let its maximize button and the Play/Review guess-map maximize button fill the viewport.
- Removed the redundant GeoTrainer map-style checkbox; Auto, Light, and Dark now directly control map colors, including for profiles that previously disabled the old switch.
- Added Previous before Reveal in Uploaded map Learn, so learners can revisit sampled locations and move forward again with Next.
- Moved Learn's X to the right side of the header, with a hover and focus hint explaining that it opens Learn setup.
- Kept the mobile Play guess action in view, cleared the active-session menu overlap, moved Review progress into the mobile header, made result dialogs more compact, and added a default-on country-border toggle.
- Fixed Light and Auto map colors showing a dark base map; Light now applies a complete light style on every map surface.
- Replaced the interior toggle in Custom Learn and Play with an Outdoors/Mixed dropdown, and added Auto/Light/Dark map colors in Settings → Display.
- Added Map Maker JSON upload as a fourth Learn path and a Play location source, with exact panorama selection, local map retention, and normal progress tracking.
- Added an X action in Learn to return directly to setup and choose a new mode.
- Reused Learn's simple X control for active Play and Review exit actions.
- Skipped unchanged cloud backup reads and kept imported map files out of cloud backups to reduce Supabase usage.

## 2026-09-17

- Added optional maturity-aware Review view variation with a 0–100 difficulty setting, heading-first progression, conservative geographic candidate checks, original-view fallback, and independent contraction after failed generalized recall.
- Kept every varied Review on its original canonical card while recording the shown panorama, heading, distance, and generalization level on the attempt.
- Added deletion for Personal Notebook notes in My Clues, including linked-image suppression and cloud-safe deletion markers.
- Kept sticky table labels compact on phones so country names no longer cover Statistics values while horizontally scrolling.
- Added persisted, default-off interior Street View toggles for Custom Learn and Play.
- Added shared panorama and map preferences for imagery dates, road labels, mobile motion viewing, movement controls, map type, touch gestures, clickable places, and GeoTrainer light/dark map styling.
- Fixed resumed Play rounds counting closed time as hours of active round time.
- Clarified session history with compact same-day time ranges and readable dedicated row columns.
- Added a workspace camera control that copies four transient 90° Street View directions as one 360° clipboard image.

## 2026-09-16

- Added an explicit Settings saving state, blocked duplicate submissions, preserved errors in the open modal, and confirmed successful saves after the modal closes.
- Prevented background cloud imports from clearing Notebook clue images saved during synchronization.
- Rendered pasted Notebook Markdown formatting in My Clues and removed stray standalone list markers.
- Kept broken photo-linked notes visible with a localized recovery warning instead of silently pairing them with another panorama image.
- Added automatic missing-photo detection for absent records, unresolved signed URLs, and failed image loads, plus a visible My Clues recovery count.
- Added safe exact-image repair from panorama-scoped drafts and private per-user Storage before sync; panorama screenshots are never substituted.
- Added development-only saved-content count invariants with privacy-safe host/session/device diagnostics, and regression coverage for first, later, and all-black same-panorama clues.

## 2026-09-15

- Kept Available notes, saved clue images, and unsaved Notebook work visible throughout one continuous Street View walk, while reconnecting legacy image-only saves to their nearby richer Personal descriptions.
- Retried transient Supabase backup failures and removed duplicate location-preview bytes from cloud payloads while retaining local previews and private hosted Notebook/Coach images.
- Added Study-history audit rows showing new cards versus re-encounters, nearby surviving Personal clues, rounded active durations, and a direct panorama link even when the location index is missing.
- Reconnected detached Notebook images after walking when a same-country capture and note were saved within five minutes.
- Replaced raw panorama IDs in forgotten-place statistics with resolved country names or a localized unknown label and a direct Street View link.
- Sorted the complete My Clues library chronologically across Personal images, Notebook descriptions, Coach notes, and Meta lessons before pagination.
- Added exact localized timestamps to every History row and start–end timestamps to every Statistics session so activity can be matched against saved notes and clues.
- Merged the latest remote backup before every coalesced cloud upload so localhost and production sessions on the same account cannot replace each other's unique progress.
- Scoped unsaved Notebook text and clue-image drafts to each panorama so switching Learn or Play locations cannot replace them, and kept the location-clue control visible with a count and clear empty state.
- Reconnected orphaned Personal Notebook images to their surviving descriptions when their panorama matches and their save times are within five minutes, without rewriting existing records.
- Clarified Coverage exposure by showing unique panoramas and total encounters together in country-map tooltips, and labeled the matching Statistics column as Panoramas.
- Preserved headings, bold emphasis, and bullet lists when rich text is pasted into Notebook, and documented the external Gemini-to-Notebook workflow in the localized Game Guide.
- Standardized the Game Guide ending so External resources, Frequently asked questions, and Contact remain the final three sections.
- Made the Home primary action respond to due reviews and paused Study or Play work, and refocused its message on learning from mistakes.
- Clarified the Swedish Guide's core promise, active-recall explanation, and GeoGuessr comparison around the Study–Play–Review learning loop.
- Simplified primary navigation terminology across all eight locales to Learn, Play, Review, Clues, and Progress equivalents without changing noun labels elsewhere.
- Serialized rapid Notebook saves, merged Notebook and Coach histories by record across devices, and ignored stale nearby-panorama reads so saved notes cannot be silently replaced or temporarily disappear.
- Kept active AI Coach and submitted-clue analysis running while the learner walks between nearby panoramas, and saved each completed result against the location where its request began regardless of which country the Coach ranked first.
- Prevented Coach reasoning recipes from appearing as generated learner text across all six styles, while keeping Deep Geography's supported causal explanation natural and detailed.
- Required every Coach style to return a learner-facing summary instead of leaving its lead section blank.
- Required generated Study locations to provide Street View navigation links, matching movable Play rounds and avoiding isolated no-walk starts.
- Localized the shared Coach Candidates heading in every supported UI language.
- Reset the Notebook photo, analyzed clue, category, and note text together after a successful save, including their reload-persistent drafts.
- Made every completed Coach analysis retain its exact current-view preview in Available notes and My Clues, while keeping additional 360° views transient and de-duplicating linked entries.
- Reworked Coach output around explicit candidate comparisons, missing evidence, generic-clue detection, confusers, causal geography, and highest-information next clues; narrower regional confidence can no longer exceed the overall result.
- Polished the six-style picker with a distinct emoji and purpose for every Coach, organized the full style guide inside the standalone Game Guide, and placed “Always ask” inside the persisted style dropdown without a duplicate Settings guide button.
- Rendered Coach explanations with safe headings, emphasized labels, bold text, bullets, and style accents across live results, captured clues, Available notes, and saved-clue details.
- Moved the per-analysis Coach chooser into a centered, scroll-contained modal with readable full descriptions, and kept full style-specific analysis visible when AI notes reopen from My Clues.
- Kept the best schema-valid grounded Gemini response when a detail-quality retry cannot reach another usable key, instead of replacing that result with a misleading 503.
- Added independent Review filters for wrong country, score range, and attempts from the last 7, 30, 90, or custom number of days; wrong-country and score criteria combine as alternatives.
- Preserved the completed-card count when a Review session resumes after reload and clarified the live header with “of”, remaining-card, and saved-progress labels on every viewport.
- Added six independent AI Coach styles—Quick Guess, Meta Coach, Elimination Coach, Deep Geography, Memory Coach, and Pro Analyst—plus separate Short, Normal, and Deep explanation depth.
- Added a localized in-app style guide, a default per-analysis style picker, and a persisted preferred-style option without Adaptive or automatic switching.
- Strengthened Coach prompts against fabricated identities and causal stories, required candidate-specific evidence and confuser comparisons, and labeled likelihoods as AI estimates.
- Randomized fresh-profile daily Review queues while preserving an existing oldest-due preference.
- Restored the shared Play/Review pinpointer inside the visible mobile viewport and contained Statistics tables, charts, and heatmap legends on narrow screens; future-due values now open with a normal tap.

## 2026-09-14

- Kept opened Google maps warm across panel minimization, round changes, Explore Map reopen, and Statistics or Coverage tab switches, while leaving tile caching to the browser instead of persisting imagery.
- Saved every completed text-only Coach analysis into Available notes and My Clues, serialized concurrent history writes to prevent lost entries, and kept the homepage clue total aligned.
- Localized Coach candidate country names to the selected AI language and retried vague country rationales that claim a generic fit without naming a distinguishing visible feature.
- Kept every learning tool fully accessible throughout Review, including Meta explanations, saved note text, and Coach country candidates and probabilities before guessing, without supplying the current card's persisted answer metadata.
- Paginated Sessions, Review improvement history, and every filtered History tab at 10 entries per page, with complete localization for the improvement-history heading.
- Removed the nested scrollbar from Available notes so the panel uses one continuous scroll area.
- Added a detailed Robinson-projection SVG country heatmap beneath Coverage, synchronized to the selected map layer with a saved user-selectable warm, blue, green, or purple palette, exact Exposure counts on hover, and layer-specific empty-state labels.
- Reduced Supabase disk I/O by combining rapid local changes, skipping unchanged full-backup writes, avoiding duplicate local backup reads when clue images are already hosted, and throttling repeated focus pulls.
- Fixed a startup crash caused by checking Play mistake-practice eligibility before a game summary was loaded.
- Prompted AI Coach to show a “Most likely in” region, city, quarter, landmark, or exact-place estimate after its country ranking only when the overall and narrower-location confidence are high and multiple visible clues support it.
- Made Practice mistakes enter Review correctly while retaining each Play mistake as its original new card and recording correction answers separately.
- Renamed Play's unrestricted environment choice from Mixed to Any environment so it is clear how to remove a City, Suburban, or Rural filter.
- Hid Play's Practice mistakes action when the selected game has no eligible persisted attempts.
- Let daily new-card and review limits be cleared and replaced without forcing a leading zero.
- Moved the Learn and Review compass switch into the shared panorama learning toolbar, with mobile-sized touch targets.
- Kept mobile Statistics section tabs and wide tables horizontally swipeable without handing the gesture to browser navigation.
- Added localized troubleshooting for black Street View imagery, including browser, extension, graphics-acceleration, and driver checks.
- Added a localized contact section for suggestions and bug reports.
- Counted foreground Play and Review activity in active minutes, refreshed persisted homepage totals after navigation, and prevented stale reads from replacing newer totals.
- Added touch-and-hold values to the Future due review chart on mobile.

## 2026-09-13

- Removed ungraded Learn source cards from scored attempt history and performance totals, resumed the existing Study visit after reload, and moved Personal source/timestamp metadata beneath My Clues note text.
- Added Study's shared Notebook and Available notes toolbar to Play, including the nearby saved-note badge, and aligned AI Coach with the same tool group.
- Refreshed Available notes and its badge immediately after a Notebook save in Play, Review, Study, and Coverage so newly written comments appear without reloading.
- Loaded local language preferences before first render and made Coach wait for them, then strengthened local and hosted Gemini prompts to keep every natural-language response value in the selected AI language without changing the JSON schema.
- Rejected substantially mixed-language Coach responses before display and added a visible-evidence explanation beneath every newly ranked candidate country.
- Kept localhost Coach requests on the matching local backend so frontend work no longer silently uses stale hosted Coach behavior; deployed the same response contract to the hosted function.
- Disabled and greyed out Meta in Learn setup after every lesson is completed, while selecting only unfinished lessons until then.
- Grouped Available notes and its badge across same-country Street View nodes within 50 metres so moving a few steps no longer hides nearby Coach or Notebook history.
- Applied imported cloud progress to open screens without forcing a page reload or resetting the active view.
- Restored each Study panorama's saved-for-Review state from persisted attempts so its save action stays hidden after reload.
- Synced every persisted setting category and resolved Review conflicts by the latest grading time; added safe development diagnostics for Vite reloads and corrected the revealed-location minimize contrast.
- Prevented React development remounts from configuring the Google Maps loader twice and emitting a misleading reset warning.
- Paginated the filtered My Clues library at 20 entries per page with localized navigation and safe last-page clamping.
- Added the full Study learning toolset to Coverage panoramas, with AI Coach, Notebook, linked Meta, and Available notes safely scoped to the opened location and connected to Review.
- Added a fourth homepage Known clues total for Personal, AI-assisted, and Meta entries, and removed activity-only ghost records from session totals and lists.
- Added opt-in click and map-pin sounds plus CC0 ambient music with separately saved volumes.
- Clarified Review summaries as previous versus today averages and improved/same/worse results, fixed dark activity-calendar colors, and distinguished a reached daily limit from a completed queue.
- Raised fresh-profile limits to 50 new cards and 500 daily reviews, included AI-assisted Play in Statistics by default, and coalesced same-country Review cards within 50 metres.
- Synced paused workspaces and other settings by newest update across signed-in screens, with a refresh when a screen regains focus.
- Made Notebook writable throughout Review with spoiler-safe image analysis, and kept all learning aids accessible on the result until the learner continues.
- Kept localized Reveal and Next controls visible throughout mobile Learn, grouped Coach and learning aids into one modal-safe toolbar, and made Statistics tables reliably swipeable with a readable sticky first column.
- Replaced the contributor toggle in Custom Learn and Play with an Official / Mixed / Contributor imagery selector that defaults to official panoramas while preserving older saved preferences and games.
- Scheduled day-based reviews at the configured local reset boundary instead of 24 hours after the prior action, and added an exact local-time plus hours/minutes preview to Review preferences.
- Made Review and Preferences show the same earliest persisted due time in the UI language, and replaced free-text timezone entry with a timezone dropdown.
- Kept result-map legend labels and fullscreen controls readable in both light and dark themes.
- Labeled ungraded Learn review sources as new cards, excluded them from wrong-country filters, and explained when daily limits hold back due cards.
- Kept mobile learning tools in a vertical side rail below map controls and anchored Reveal / Next to the visible viewport in normal and fullscreen layouts.

## 2026-09-12

- Renamed the visible Study destination to Learn and added Custom, Meta, and world-map Street View entry paths while preserving existing Study data compatibility.
- Added 359 normalized Meta lessons from paired OpenGuessr and usable GeoMetas records, with a persistent top-right lightbulb, recorded panorama headings, eight-language explanations, and explicit Review saving.
- Added a panorama-scoped Notebook beside AI Coach for multiple independent personal hints and optional pasted, uploaded, or captured clue analysis; category and text may be empty, saves reuse Review, and the image workspace opens immediately without a redundant Known Clues row.
- Added spoiler-safe Meta and saved-clue toggles during Review: visual hints are available before guessing, while answer-bearing text appears only after submission.
- Added Personal, AI-assisted, and Meta-lesson filters to My Clues; personal Notebook text and explicitly saved Meta lessons now appear in the library.
- Moved low-scoring Review cards to the end of the active session until passed, keeping every retry as a separate attempt.
- Repaired malformed escaped accents in Coach output, added accented-Latin and Cyrillic regression coverage across all eight supported languages, and updated the localized guide for Learn, Meta, Notebook, hints, and relearning.
- Added an optional contributor-panorama filter to Custom Learn and Play generation while leaving older preferences and saved games compatible.
- Improved pasted-clue teaching prompts to identify the selected plant or road object as specifically as the image supports, explain its geographic range, and state when fine details are unreadable.
- Made clue analysis explain the meaning of visible sign symbols, letters, numbers, colors, and restrictions before discussing country likelihood.
- Made readable brand clues explain the company or organization, its origin or main market, cross-border availability, and why that changes clue reliability.
- Randomized Gemini key selection and retry every available key before Coach reports quota or service failure.
- Hosted and optimized all 359 Meta reference images locally, showing lesson text after the image is ready and retaining a translated failure state.
- Simplified Meta and Explore Map to the existing Reveal → location card → Save for Review flow; Explore Map returns through a dedicated Back to world map action.
- Made personal and Meta library rows open detailed Street View views with compact saved/reference-image overlays; Meta lessons enter My Clues only after explicit Review saving.
- Added a counted, scrollable Available notes history per panorama in Learn and Review; Coach analyses append immediately and no longer reopen as active results after reload.
- Made Notebook, Meta, and saved-clue panels draggable with the same viewport bounds as AI Coach.
- Kept the AI Coach launcher visible while its panel is open or has been dragged.
- Fixed dark-theme contrast in the Learn chooser, Meta advice, and Notebook editor, added a pointer from the first-use advice to the Meta lightbulb, and moved Notebook image capture above personal notes.
- Compressed explicitly uploaded and captured clue images, privately hosted them per account, and reused the exact hosted preview across Available notes and My Clues without embedding duplicate image bytes in cloud backups.
- Fixed due Review cards opened through custom practice so completing them advances and persists their schedule; future cards remain unchanged.
- Added startup reconciliation from saved Review attempts so an already-completed card cannot remain falsely due after reload.
- Added a continuous country/location mastery heat layer whose brightest colors require long intervals, many successful repetitions, and few lapses.
- Refined multi-clue dialogs with contained previews, clearer source and timestamp hierarchy, readable candidates, and aligned actions.
- Prevented AI Coach from treating GeoGuessr, GeoTrainer, browser, map-control, attribution, or screenshot-tool interface elements as geographic evidence.
- Moved the Google Maps action into the revealed location-card header, replaced Hide's eye with a minimize affordance, made the card draggable, and added fullscreen to its embedded map.
- Added Resume or Start new prompts for paused Learn and Play sessions, with Back preserving the previous screen.
- Saved and hosted plain Notebook screenshots even without AI analysis, linking each preview directly to its personal note.

## 2026-09-11

- Fixed AI Coach output that could repeat a country as a specific location estimate or append unsolicited quiz-card blocks to a normal analysis.
- Clue details now use one unambiguous close action and open in a compact, centered overlay instead of exposing a redundant country-list modal. The library’s country filter shows clue counts, sorts countries by count, and has a dedicated clear button.
- Pasted-clue analysis now prioritizes an obvious foreground subject while still considering surrounding context, and avoids guessing the object type when the crop is unreadable.
- After a location is revealed, AI Coach now switches from guessing to an honest explanation, clears stale candidate rankings, and states when the imagery was insufficient; strong location estimates appear only before reveal and without metadata. Explain can consult bounded GeoMetas facts for the revealed country but may mention only features visible in the image. Added Learnable Meta to the learning resources.
- Preserved the active AI Coach analysis and clue preview/result across reloads without carrying them into another panorama, and kept the guess map rendered after mid-round language changes.
- Added a localized Print Screen → paste → Analyze clue workflow to the user guide.
- Fixed AI Coach falsely reporting that Street View was still loading after moving away from the round's starting panorama or opening another live panorama.
- Unified collection dropdown hierarchy across Study, Play, Review, History, and Statistics, made Review scheduling settings fill a responsive two-column layout, and normalized clue details around a compact live Street View.
- Fixed Google sign-in returning to the GitHub Pages account root instead of the deployed GeoTrainer app.
- Added a localized guide section explaining how GeoTrainer supplements GeoGuessr with durable retention, targeted confusion practice, and automatic review.
- Aligned the closed AI Coach launcher with the adjacent compass control.
- Study and Play setup now support focused multi-country mixes with removable flag pills for confusion drills.
- Country-mix drafts now remain intact when focus leaves the picker, and native dropdown type-ahead remains available for keyboard navigation.
- Saved Study locations and submitted Play rounds now retain the current view for richer coverage previews; existing records remain compatible.
- Clue details now open as a centered, dimmed workspace with country flag, live Street View, saved capture, and direct Google Maps links.
- Fixed Review panoramas that could remain black until reload and improved dark-mode controls and coverage preview contrast.
- Updated the guide across all supported languages for country mixes, Clues, saved-view previews, and keyboard dropdown navigation, and removed implementation-specific storage wording from the account dialog.

- Added a Markdown-driven `/docs/` guide that opens in a separate browser tab from the main menu and explains active recall, spaced repetition, and the Study–Play–Review loop.
- Expanded the guide into a searchable, nested manual with detailed workflows, scheduling behavior, limitations, recovery steps, and FAQs.
- Added Plonk It and GeoHints as localized external learning references in the guide.
- Added GeoMetas as a localized external learning and quiz reference.
- Replaced field-operations jargon with direct learning and sync language across the main menu and account dialog.
- Opened AI Coach to guest sessions, merged the redundant pre-answer Hints action into Analyze, and removed unnecessary sign-in privacy copy.
- Added a Supabase Edge Function backend for AI Coach and 360° Street View capture on the deployed app.
- Added custom 1–100-round games, per-mode performance statistics, and navigation-connected panorama checks for movable games.
- Separated Review from Statistics, folded location/history views into Statistics, and made saved game sessions open their summaries.
- Expanded review-card maturity into New, Learning, Relearning, Young, and Mature states with long-term mastery ranks.
- Fixed narrow guess-button wrapping and independently anchored the AI Coach and guess map without either panel pushing the other.
- Made the AI Coach and guess map draggable within the viewport, and stopped restored Study panoramas from counting as new encounters.
- Centered a high-contrast round clock over Street View: elapsed time counts up for unlimited rounds, while timed rounds count down with a clear urgent state.
- Added a cloud-synced compass-style preference with a compact heading bar inspired by the gameplay reference and the existing dial as an alternative.
- Split Preferences into persistent Language, Review, and Display tabs.
- Improved Coach-analysis bullets and added a full saved-clue detail view for every stored analysis field.
- Restored elapsed/countdown clocks and the active Street View panorama, camera angle, and zoom after reloads.
- Localized remaining Statistics labels and Street View, location, collection, result, summary, and cloud-account UI copy across all supported languages.
- Made every Geography statistics table column sortable and localized its headers, labels, and sample statuses across all supported languages.
- Retired redundant bookmark and coordinate-copy controls while preserving existing saved bookmark data for compatibility.
- Clarified Street View Static API key-restriction failures and kept long table headings visible while scrolling.
- Reworked coverage-map hover labels to remove clipped Google popup chrome and nested scrolling.
- Added a persisted opt-in AI-assisted Play filter to Statistics, surfaced the assisted-round count, and marked assisted attempts in History.
- Polished phone layouts with a hamburger header, correct route highlighting, contained navigation and filters, a compact pinpoint-map toggle, and internally scrolling statistics tables.
- Added a cloud-synced Light/Dark color-palette selector under Display preferences.
- Moved Study reveal/next controls into a centered action dock and removed the sun-direction hint and toggle.
- Docked the closed AI Coach launcher below the right-side tools while keeping its open panel draggable, and restored enabled Play-lobby action contrast.
- Added FlagCDN flags throughout country statistics, review/history rows, and AI Coach probability results.
- Stopped statistics table headers from sticking over rows while the page scrolls.
- Rephrased the saved-clue prompt as a user action and removed redundant ISO codes beside AI Coach flags.
- Added a first-class Clues library with country browsing, summaries, full-detail cards, and direct practice actions.
- Added matching Study setup and single-country selection to Study and Play, retiring the crowded Study header controls.
- Simplified AI Coach to one continuous Analyze action, retained evidence while moving or revealing, decoded escaped localized text, and replaced card-front/back output with learning notes.
- Automatically created a Review source when a Study clue is saved and removed the now-redundant action afterward.

- Replaced the floating AI Coach launcher with a compact map icon, added a Play setup toggle, and kept model names out of the UI.
- Improved AI Coach evidence quality, confidence calibration, contradiction handling, 360° analysis, and GeoGuessr hint retrieval.
- Auto-save coaching notes and analyzed clue screenshots; saved clue images remain removable and cloud-synced.
- Added separate UI, game, and AI language preferences for English, Spanish, Portuguese, French, German, Italian, Russian, and Swedish.
- Added Anki-style review statistics, due scheduling, daily limits, strictness presets, relearning controls, and configurable review order.
- Added first-Play scheduling and post-game mistake practice that repeats weak answers until corrected.
- Kept custom practice independent from spaced-repetition due dates.
- Fixed multi-location review queues, simplified review completion, centered navigation, and removed redundant manual backup UI.
- Quieted cloud sync by coalescing rapid local saves, and stopped Vite from restarting for server-only edits.
- Persisted language, scheduling, game setup, map-aid, Study-filter, and active-review preferences in the cloud-backed settings store.
- Restored the active Study panorama, unfinished Play round, Review queue, Training Log tabs, Statistics section, and Coach panel after reloads.
- Rebound restored Play panoramas through canonical Street View lookup after Maps initialization, with a durable loader configuration guard for HMR.
- Ignored empty hot-reload session records so Statistics no longer counts reload noise as learning sessions.
- Added a prominent daily Review action, localized completion/next-due states, and configurable timezone/reset boundaries with migration-safe defaults.
- Replaced screen-sharing capture with automatic server-side Street View capture and bounded capture timeouts.
