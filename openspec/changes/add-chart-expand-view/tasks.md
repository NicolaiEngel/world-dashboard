# Tasks

## 1. Expand button

- [ ] 1.1 Add the expand button (⤢, `aria-label="Enlarge chart: <title>"`) to the tile template's chart area, with styles (low opacity, full on hover or focus, visible focus outline). Verify: the smoke check finds 13 buttons with correct names, and all tiles are still the same size.

## 2. Large view

- [ ] 2.1 Add `<dialog id="expand">` to `index.html` (title row with the MOCK badge slot, unit, chart canvas, source link, close button) and its styles (large on desktop, full screen at ≤ 520 px). Verify: the dialog markup exists, with no text beyond the title, badge, unit and source taken from the data.
- [ ] 2.2 Write `site/expand.js`: open via button or chart click; show the full series with more ticks; nearest-point tooltip formatted with decimals and unit; destroy the chart on close; close with Esc, button or backdrop; return focus. Verify: new smoke-check cases cover keyboard open and Esc close with focus returned, a backdrop click, the full-series span (temperature about 2 years), the tooltip text on hover, a mock badge in the Bitcoin view, no outside requests, and the phone layout with no horizontal scroll.

## 3. Docs

- [ ] 3.1 Update CLAUDE.md (step 3 dropped; step 5 reduced to the expand view) and `DECISIONS.md` (why). Verify: the MVP plan table matches what's built.

## Workflow follow-up

- Open a PR. After merge, run the smoke check against the live URL, then archive the change.
