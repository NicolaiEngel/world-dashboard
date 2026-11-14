# Tasks

## 1. Mock data

- [x] 1.1 Add daily `temp_anomaly` (730 days, own seeded RNG, source Copernicus Climate Pulse, caveat kept) to `scripts/make_mock_data.py`. Verify: the generator runs and `temp_anomaly` has cadence `daily` with ISO day dates.
- [x] 1.2 Add `co2_ppm` (Climate, daily, ppm, 2 decimals, seasonal cycle on a trend, a few gaps, source NOAA GML Mauna Loa), placed right after `temp_anomaly`. Verify: the generator runs and the file lists 13 indicators.
- [x] 1.3 Regenerate `data/mock-data.json`. Verify:
  - running the generator twice gives identical files;
  - `git diff` touches only the `temp_anomaly` and `co2_ppm` entries;
  - the other 11 series are byte-identical.

## 2. Page skeleton and vendored chart library

- [x] 2.1 Vendor the pinned Chart.js 4 UMD build as `site/vendor/chart.umd.min.js`, keeping its licence header. Verify: the file loads in a blank page with `window.Chart` defined.
- [x] 2.2 Add the `site/data -> ../data` symlink and `.gitignore` (`_site/`, `.DS_Store`). Remove the committed `.DS_Store` files. Verify: `python -m http.server` in `site/` serves `/data/mock-data.json`.
- [x] 2.3 Create `site/index.html` (header, main, tile `<template>`, no external URLs) and `site/styles.css` (all colours as `:root` variables, light mode, system font stack). Verify: `grep -rE 'https?://' site/ --exclude-dir=vendor` finds no asset URLs.

## 3. Rendering

- [x] 3.1 Write `site/app.js`: load the data, render the header (title, latest `as_of`, inert 🌐 ✏️ 👤 icons) and category groups in `categories` order. Verify: the local page shows six headings in the right order.
- [x] 3.2 Render the identical tiles: title, definition, formatted value plus unit, footer with frequency, date and source link (`target="_blank" rel="noopener"`). Verify: 13 tiles, with values that match the last series points.
- [x] 3.3 Draw the mini charts: last 365 days for daily tiles, full series for annual tiles, the same `--chart-line` colour, no axes or tooltips, no animation. Verify: every tile shows a line, and the temperature tile shows about 12 months.
- [x] 3.4 Add the empty dashed slot at the end of the last group, and the "data could not be loaded" message for a failed load. Verify: the slot appears after Demography, and with the data file renamed the message shows and there are no uncaught errors.
- [x] 3.5 Make the layout responsive: fixed-size tiles, wrapping groups, no horizontal scroll at 360 px. Verify: screenshots at 1440 px and 390 px look like the wireframe, and the tile text doesn't overflow.

## 4. Smoke check

- [x] 4.1 Write `tests/smoke_page.mjs <url>`. It checks:
  - 13 tiles;
  - no console errors;
  - every request goes to the page's own origin and no cookies are set;
  - all tiles are the same size;
  - no horizontal scroll at 360 px;
  - the error path;
  - and it saves screenshots.

  Verify: it passes against `python -m http.server` in `site/`, and fails if a tile is removed from the data.

## 5. Deployment and docs

- [x] 5.1 Add `.github/workflows/deploy.yml` (push to `main` plus `workflow_dispatch`, official Pages actions at their current majors, `cp -rL site _site`, concurrency group `pages`). Verify: the YAML parses, and running the assemble step locally gives `_site/index.html` and a real (non-symlink) `_site/data/mock-data.json`.
- [x] 5.2 Create `DECISIONS.md` covering:
  - the Chart.js version and licence;
  - the symlink approach and its Windows caveat;
  - the Pages setting;
  - "Open questions": the schema_version wording, and the mock BTC/FX source URLs.

  Verify: every open question from design.md is listed.
- [x] 5.3 Add a short "Run locally" note to `DECISIONS.md` or a stub `README.md` (`cd site && python -m http.server`, plus the smoke check command). Verify: the commands run as written.

## Workflow follow-up

- Tell Nicolai the one setting to change before merging: Settings → Pages → Source: "GitHub Actions".
- Open the PR for this step. After approval and merge, confirm that the workflow run succeeded.
- Run `node tests/smoke_page.mjs https://nicolaiengel.github.io/world-dashboard/` and report the live URL.
- Archive the change with `/openspec-archive-change` once the live check passes.
