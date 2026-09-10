# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person using Street View repeatedly to build durable geographic intuition, review mistakes, and protect years of personal training history.

## Product Purpose

Turn random Street View study and GeoGuessr-style play into a long-lived personal trainer: encounter places, retain every attempt, schedule weak locations for review, and understand real personal coverage.

## Positioning

The same panorama is a stable learning object shared by immersion visits, independent play attempts, bookmarks, and spaced reviews rather than a disposable game round.

## Operating Context

Frequent desktop and mobile-web sessions alternate between low-pressure Study, scored Play, and focused Review. Google Street View and Maps supply panoramas, guesses, and reverse geocoding. Progress remains local to the browser and must be exportable.

## Capabilities and Constraints

- Preserve the current Study and Play flows, lobby, movement rules, timers, scoring, summaries, bookmarks, collections, and saved history.
- Use `panoId` as canonical location identity where available; repeat visits and attempts reference it without overwriting history.
- Country seed/sample points generate locations only. Personal coverage contains only encountered panoramas. Performance derives only from attempts.
- IndexedDB is the durable store, with a one-time non-destructive localStorage migration and validated merge/replace backup files.
- Google Maps API configuration comes from `VITE_GOOGLE_MAPS_API_KEY` in `.env`.

## Evidence on Hand

The existing functional Vite/React implementation and its localStorage data shapes are the source of product truth. No marketing claims or external benchmarks are available.

## Product Principles

- Protect progress more aggressively than transient UI state.
- Keep immersion optional and spoilers behind an explicit reveal.
- Make weak material easy to revisit without turning the app into an analytics dashboard.
- Preserve attempts as immutable evidence of improvement.
- Prefer clear, compact training controls over decorative complexity.

## Accessibility & Inclusion

Keyboard access, visible focus, semantic controls, readable contrast, reduced-motion support, and responsive layouts are baseline requirements.
