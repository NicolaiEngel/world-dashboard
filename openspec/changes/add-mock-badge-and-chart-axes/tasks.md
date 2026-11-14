# Tasks

## 1. MOCK badge

- [ ] 1.1 Add a badge slot to the tile template's title row and render a `MOCK` pill (with `title` and visually hidden text) only when `mock === true`. Add the `--badge-*` CSS variables and pill style. Verify: locally, all 13 tiles show the badge, and setting one indicator to `mock: false` in a copy of the data removes only that tile's badge.
- [ ] 1.2 Extend `tests/smoke_page.mjs`: badge presence equals each tile's `mock` flag, and the badge carries an accessible description. Verify: the smoke check passes, and fails when the badge is removed from the template.

## 2. Chart axes

- [ ] 2.1 Turn on the y and x scales in `drawChart`: compact y ticks (max 3, `grace` 5%), x ticks as years (annual) or "Mon YYYY" (daily) with no rotation, axis colours from new `--axis-text` and `--axis-grid` variables, still no tooltips. Verify: screenshots at 1440 px show labelled axes on every tile.
- [ ] 2.2 Increase tile height (desktop 272 px, phone 250 px) and cap x ticks at 2 on narrow charts. Verify: screenshots at 390 px and 360 px show readable, non-overlapping axis labels, and tiles stay identical in size.
- [ ] 2.3 Extend `tests/smoke_page.mjs`: each chart has visible x and y scales with ≥ 2 labelled ticks, y ticks span the plotted range, x labels match the year or "Mon YYYY" format, and x labels don't overlap at 360 px. Verify: the smoke check passes locally, and fails when the axes are hidden again.

## 3. Empty slot

- [ ] 3.1 Remove the empty dashed slot from `site/app.js`, plus its CSS (`.tile-slot`, `--color-slot-border`), and change the smoke check to assert that no `.tile-slot` exists. Verify: the Demography group shows only its two tiles, and the smoke check passes.

## 4. Docs

- [ ] 4.1 Add a `DECISIONS.md` entry: the badge moved from step 3 into this change, axes are on mini charts (y not starting at zero, category x axis without a date adapter), the new tile heights, and the removal of the empty slot. Verify: the entry exists and matches design.md.

## Workflow follow-up

- Open a PR. After it's merged and deployed, run `node tests/smoke_page.mjs https://nicolaiengel.github.io/world-dashboard/` and report the live URL.
- Archive the change and sync the `dashboard-page` spec once the live check passes.
