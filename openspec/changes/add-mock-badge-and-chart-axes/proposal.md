# Proposal: MOCK badge on mocked tiles, and axes with scales on the mini charts

## Why

Two problems on the live page:
- **Nothing on a tile says its numbers are made up.** CLAUDE.md requires mock data to be "always labelled MOCK on the page".
- **The mini charts can't be read quantitatively.** Without axis scales you see a shape but not its range or time span.

This was requested after step 2 went live.

## What Changes

- **MOCK badge:** every tile whose indicator has `mock: true` shows a "MOCK" badge next to its title. Tiles with real data (`mock: false`, from step 4 on) show none. The badge is neutral grey and uses no good/bad colouring.
- **Axes with scales:** every mini chart gets:
  - a value axis with a few labelled ticks;
  - a date axis with a few labelled dates (years on annual tiles, months on daily tiles);
  - faint grid lines.

  It's still a small chart with no hover tooltips, and the window rules stay as they are (last year for daily tiles, full series for annual tiles).
- **Tile height** grows a little so the axes fit. All tiles stay the same size.
- **BREAKING (spec):** this replaces the step 2 rule that the mini charts have no axes.
- **Plan impact:** the MOCK badge moves forward from step 3. Step 3 is left with the change line and the "x of 13 live" count.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-page`:
  - the tile structure gains the MOCK badge;
  - a new requirement says when the badge appears;
  - the mini chart requirement now requires labelled value and date axes instead of forbidding them.

## Impact

- **Code:**
  - `site/app.js`: badge rendering and Chart.js axis options;
  - `site/styles.css`: badge style, new colour variables, tile height;
  - `site/index.html`: a badge slot in the tile template.
- **Tests:** `tests/smoke_page.mjs` gains checks for the badges and the axes.
- **Docs:** a `DECISIONS.md` entry.
- **Unchanged:** the data format, the deploy workflow, the vendored chart library.
