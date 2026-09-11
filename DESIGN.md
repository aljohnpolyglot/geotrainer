# Design — GeoTrainer

## Direction

A contemporary weather-observation field log. Street View is the live horizon; everything around it behaves like a calm instrument station: pale observation sheets, storm-blue housings, vermilion warnings, signal-lime current state, and exact ruled data strips. The result should feel authored for geographic fieldwork, not assembled from dashboard components.

## Mode

Operate. Fast scanning, repeat use, clear state, and data trust outrank decoration.

## Visual System

- Ground: storm ink `#08263a`; observation paper `#f2f0e7`; ruled blue-gray `#b9c5c9`; carbon text `#102734`.
- Signals: ultramarine `#0868f2` for primary/current, vermilion `#ed4b2f` for warning/wrong, signal lime `#c9f05b` for confirmed/correct, sky `#8ad7e8` for information.
- Typography: a humanist system sans for interface copy; measured values and country codes use monospace. Headings are compact, decisive, and never oversized.
- Geometry: 2–8px instrument corners, square data cells, 12–14px only for elevated observation sheets. Pills are reserved for terse status.
- Surfaces: light field sheets use one soft offset shadow and no border; embedded controls use fine blue-gray rules. No gradients, glass, glow, or decorative blur.

## Composition

- The homepage keeps its established layout; rich product documentation opens in a separate `/docs/` browser tab from a clearly labeled Guide route.
- A compact storm-blue station bar keeps mode, collection, and game state in one predictable line above the panorama.
- Study, Play, and Review are equal primary destinations, labeled with names and short route codes.
- Street View owns the remaining viewport. Context controls form a compact horizontal instrument bar.
- Review opens into a workbench with Progress, Queue, Coverage, History, and Data tabs; dense information uses cards only where grouping is real and tables where comparison matters.
- The current selection uses a fixed ultramarine or lime signal cell, never a decorative glow.

## Components

- Buttons: ultramarine primary, paper secondary, text/icon tertiary, vermilion destructive. All receive visible `:focus-visible` rings.
- Inputs: native controls on paper or storm-blue surfaces; persistent labels; 44px mobile hit targets.
- Metrics: small uppercase label, tabular value, optional restrained semantic accent.
- Status: filled square/cell for active, hollow for inactive, strike/coral for failure, mint for success.
- Empty states explain the next useful action in one sentence.
- Dialogs retain existing behavior but adopt the same surface, border, type, and action hierarchy.

## Motion

150–220ms state transitions only. A route indicator may slide between primary modes. Loading can rotate its existing icon. Reduced motion removes transforms and nonessential animation.

## Responsive Behavior

- Under 760px the route bar wraps into two compact rows and nonessential labels may hide.
- Instrument controls wrap or collapse; Street View remains the largest region.
- Tables scroll horizontally with the first identifying column kept readable.
- Overlay panels fit within the viewport and preserve access to close/continue actions.

## Accessibility

Semantic buttons and labels, WCAG AA contrast, keyboard navigation, visible focus, no color-only correctness labels, useful empty/error states, and reduced-motion support are mandatory.

## Boundaries

- Preserve the existing Play lobby structure and game mechanics.
- Never visualize country seed points as coverage.
- Never reveal location metadata before the explicit Study reveal.
- Never use decorative gradients, glassmorphism, giant titles, or card grids for every piece of information.
