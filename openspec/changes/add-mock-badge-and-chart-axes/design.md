# Design

## Context

Step 2's page (`site/app.js`) draws each mini chart with Chart.js 4.6.1. Axes are hidden, and there's no date adapter, so the x axis is a category scale of ISO date strings. Tiles are 212 × 236 px on desktop and about 158 × 214 px on a phone (two per row), and the chart takes about 60 px of height. Every indicator already has a `mock` flag. Motivation: see proposal.md. Requirements: see `specs/dashboard-page/spec.md`.

## Goals / Non-Goals

**Goals:**
- Scales you can read at a glance without hovering, on desktop and on a phone, while all tiles stay identical in size.
- A badge driven by the data (`mock`), so real tiles in step 4 lose it automatically.

**Non-Goals:**
- Tooltips, zoom, or axis titles. The unit is already shown next to the big value.
- The change line and the "x of 13 live" count (still step 3).
- The detail view's large chart (step 5).

## Decisions

### 1. Badge: a neutral pill after the title

- The title row becomes a flex row: the title (still clamped to two lines) and a `MOCK` pill that doesn't shrink.
- **Style:** 10 px uppercase, grey text on a light grey background, with colours in new CSS variables `--badge-bg` and `--badge-text`. It's neutral, because it marks data status, not good or bad.
- **Accessibility:** the pill gets `title="Illustrative mock data – not real values"`, plus a visually hidden sentence inside it, so screen readers announce it.
- The pill is rendered only when `ind.mock === true`.
- **Rejected:** striping or tinting the whole tile. It would compete with the chart, and CLAUDE.md asks for a badge next to the title.

### 2. Axes: Chart.js category scale with custom tick callbacks (no date adapter)

- **y axis:**
  - on the left, `maxTicksLimit: 3`;
  - labels formatted compactly with `Intl.NumberFormat("en", { notation: "compact", maximumSignificantDigits: 3 })`, giving "1.4", "425", "160K" and "98K";
  - font 10 px in `--axis-text`, grid lines in `--axis-grid`, no border.
  - `grace: "5%"` so the line doesn't touch the frame.
- **x axis:**
  - `autoSkip` with `maxTicksLimit: 3` and `maxRotation: 0`;
  - annual labels show the year;
  - daily labels show "Mon YYYY" (for example "Dec 2025"), built from the ISO string;
  - no x grid lines.
- **Why not a time scale:** Chart.js would need a date adapter (one more vendored file). With evenly spaced points (business days or years), a category axis is accurate enough for a mini chart.
- `events: []` stays, so there are no tooltips.

### 3. Size: taller tiles instead of smaller text

- **Desktop:** tile height goes from 236 to 272 px, so the chart area grows from about 60 to about 95 px.
- **Phone:** tile height goes from 214 to 250 px.
- Tile widths stay the same.
- **Why:** axis labels below 10 px aren't readable on a phone, and CLAUDE.md says to let the grid grow rather than shrink content.
- **Phone extras:** `maxTicksLimit` for x drops to 2 below 200 px chart width, so labels don't overlap. The y-axis width is capped by the compact format.

### 4. Empty slot removed

- Delete the slot-creation branch in `render()`, plus the `.tile-slot` CSS and the `--color-slot-border` variable.
- Nothing else depends on it.

### 5. Tests

`tests/smoke_page.mjs` gains these checks:
- each tile's badge count matches its `mock` flag;
- the badge has an accessible description;
- each chart has visible x and y scales with ≥ 2 ticks (read via `Chart.getChart(canvas).scales`);
- y ticks span the plotted min and max;
- daily x labels match `^[A-Z][a-z]{2} \d{4}$`;
- annual x labels are years;
- no `.tile-slot` element on the page;
- at 360 px, no x tick labels overlap (compare `scale._labelItems` positions, or tick pixel gaps against label widths).

Existing checks stay: uniform size, no overflow, own-origin requests only.

## Risks / Trade-offs

- [Axis labels crowd a 158 px phone tile] → At most 3 ticks per axis (2 on narrow tiles), compact numbers, and a smoke-check assertion at 360 px.
- [A category x axis gives slightly uneven spacing for gaps such as weekends and CO₂ dropouts] → Acceptable for a mini chart. The detail view in step 5 can use a proper time scale.
- [Taller tiles push Economy and Demography further down on laptop screens] → About 36 px per row, roughly 110 px over the whole page. Acceptable; revisit in step 6 if the "10-second" read suffers.
- [The y axis doesn't start at zero, which can exaggerate change] → Deliberate: these mini charts show recent movement, and the tick labels make the range explicit. Recorded in `DECISIONS.md`.

## Migration Plan

Merge to `main`, `deploy.yml` publishes, then run the smoke check against the live URL. Rollback = revert the merge.
