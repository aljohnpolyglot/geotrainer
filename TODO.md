# Product TODO

## Learn modes

Split Learn into two explicit modes while preserving the current workflow and saved data.

### Custom learning

- Keep the current Learn experience as **Custom**.
- The learner chooses collections, country mixes, environment, and sampling options.
- Existing Study bookmarks, Review sources, coverage, and history remain compatible.

### Meta learning

Build a guided active-recall loop using custom Meta Learning maps curated by this project. Each map location is explicitly linked to a prepared meta card:

1. Show a Street View location without revealing the answer or target meta.
2. Let the learner place an initial map guess.
3. After submission, open the location's linked meta card in a panel styled like AI Coach.
4. Let the learner read the card, inspect the same location, and guess again.
5. After the second submission, show the meta card again with the first-versus-second comparison.
6. If the second guess is still beyond the configured distance threshold, automatically create one new Review card for that location and meta.
7. Continue to the next curated location.

### Invariants

- The first guess must not receive answer metadata or a spoiler from AI Coach.
- Meta Learning locations and cards come from project-owned custom map data, not generated random locations.
- Every submitted guess opens the linked meta card; the card must describe something genuinely visible in that panorama.
- The second guess creates a new attempt; it must not overwrite the first attempt.
- Create at most one reusable Review source card for the location/meta pair.
- Review scheduling remains automatic and score/distance-derived.
- Do not persist Street View imagery unless the learner explicitly saves a clue image.
- Define and test the “still far off” threshold during implementation; keep it independent from ordinary Play scoring.

### Acceptance checks

- Switching between Custom and Meta Learning preserves each mode’s draft settings.
- Reloading during either guess restores the same panorama and stage.
- Submitting either guess opens the correct curated meta card in a Coach-style panel.
- A close second guess advances without creating a Review card.
- A far second guess creates exactly one Review card and then advances.
- Replaying the same location never duplicates its reusable source card.
- The complete flow works in all supported interface, game, and AI languages.
