# Proposal: Expand a tile's chart (MVP step 5, reduced)

## Why

The mini charts are small, so detail and exact values are hard to read. Step 5 is reduced, by your decision, to one feature: open a larger view of a tile's chart. There's no new text, no definitions and no new data. Step 3 (the change line and the "x of 13 live" count) is dropped.

## What Changes

- **Expand button:** every tile gets a small expand button (⤢) on its chart, labelled for screen readers "Enlarge chart: <title>".
- **Large view:** the button opens a modal with a larger version of the same chart:
  - **Data:** the tile's full stored series. Daily tiles show all ~2 stored years rather than the tile's last 12 months; annual tiles show their full history.
  - **Axes:** labelled value and date axes with more ticks than the tile.
  - **Hover/tap:** a point shows its date and value, formatted with the indicator's `decimals` and `unit`.
- **Header of the large view:** only what the tile already shows: the title, the MOCK badge if mocked, the unit, and the source link.
- **Closing:** Esc, the close button or a click on the backdrop closes it, and focus returns to the expand button.
- **Phone:** the large view fills the screen.
- **No changes to** the data format, the pipeline or the tile layout. No outside requests.
- **Docs:** CLAUDE.md marks step 3 as dropped and step 5 as reduced to the expand view; `DECISIONS.md` records why.

## Capabilities

### New Capabilities

- `chart-expand-view`: opening, contents, accessibility and closing of the enlarged chart view.

### Modified Capabilities

- `dashboard-page`: each tile gets an expand button.

## Impact

- **New:** `site/expand.js`.
- **Changed:** `site/index.html` (button in the tile template, plus the dialog), `site/app.js` (exposes each tile's data to the expand module), `site/styles.css`, `tests/smoke_page.mjs`, `CLAUDE.md`, `DECISIONS.md`.
- **Unchanged:** `pipeline/`, the data files and their format.
