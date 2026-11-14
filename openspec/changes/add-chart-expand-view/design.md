# Design

## Context

Tiles render mini charts with Chart.js 4.6.1 (vendored), using a category x axis with no date adapter. `app.js` exposes a small `window.WD` hook object, and `realtime.js` uses it. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- One large, readable chart per tile.
- Native, accessible modal behaviour.

**Non-Goals:**
- New text, definitions or caveat display.
- Long-run data beyond what's stored.
- Deep links.
- Zoom or pan.

## Decisions

### 1. Native `<dialog>` with `showModal()`

- One `<dialog id="expand">` in `index.html`. The browser provides the inert background, Esc to close, and the focus trap.
- A backdrop click is detected when the click target is the dialog element itself.
- On close, focus returns to the expand button that opened it.
- **Rejected:** a custom overlay, which would mean reimplementing all of that.

### 2. `site/expand.js`, using the existing `WD` hooks

- `app.js` adds `WD.indicator(id)` (already there) and the `chartOptions` helpers it needs, so the axis styles are shared and not duplicated.
- The expand module creates one Chart.js instance when the dialog opens and destroys it when it closes, so 13 hidden large charts never stay in memory.

### 3. Large chart settings

- **Data:** the full `series`.
- **Axes:** y with `maxTicksLimit: 6`; x via `edgeTicks`-style ticks at about 6 evenly spaced labels; both use the same date formatting (years, or "Mon YYYY").
- **Tooltips:** enabled, mode `nearest` on the index axis, `intersect: false`, so a tap anywhere on a phone shows the nearest point. The label is `formatNumber(value, decimals)` plus the unit; the title is the formatted date.
- **Line colour:** the same `--chart-line`.

### 4. Button placement

- An absolutely positioned 24 px icon button (⤢, `aria-label`) in the top-right corner of `.tile__chart`. It doesn't affect the tile's size.
- It's visible at low opacity, and fully visible on hover or focus, so it works without hover on phones.
- A click on the mini chart itself also opens the view, as a convenience for mouse users. The button stays the accessible control.

## Risks / Trade-offs

- [A category x axis spaces gaps such as weekends or missing CO₂ days evenly] → Same trade-off as the tiles, already recorded in `DECISIONS.md`.
- [`<dialog>` in old browsers] → Supported by every current browser. If `showModal` is missing, the button does nothing and nothing breaks.
