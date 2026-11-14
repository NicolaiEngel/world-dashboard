# Design

## Context

The repo currently holds `CLAUDE.md`, the OpenSpec setup, `scripts/make_mock_data.py` and `data/mock-data.json` (12 indicators, `schema_version: 2`). There's no `site/`, no workflow and no specs yet. Motivation: see proposal.md (Why). Requirements: see `specs/`.

Constraints from CLAUDE.md that shape the design:
- no build step;
- the chart library is vendored;
- the page contacts only its own origin;
- light mode, with colours in CSS variables;
- it must run under the GitHub Pages project sub-path;
- `main` is always deployable.

## Goals / Non-Goals

**Goals:**
- A page good enough to demo, so that steps 3–6 only add to tiles and never restructure them.
- One HTML template per tile, so the change line and MOCK badge (step 3) and click-to-detail (step 5) slot in.
- A repeatable smoke check that we run locally before merging and against the live URL after deploy.

**Non-Goals:**
- The config-driven page (`config/dashboard.yaml`, `manifest.json`), JSON Schemas and the `build-and-deploy.yml` pipeline. These come after the MVP; `deploy.yml` is replaced then.
- Chart interactivity, tooltips and axes on the mini charts.

## Decisions

### 1. Chart.js 4 (UMD build) vendored as `site/vendor/chart.umd.min.js`

- **Why:** it's a single MIT-licensed file of about 200 KB with no dependencies, it works from a plain `<script>` tag, and it can also draw step 5's long-run chart with axes. The licence header stays in the file.
- **Rejected alternatives:**
  - Observable Plot needs d3 as well (two files, about 2× the size).
  - Hand-drawn SVG sparklines would be the lightest option, but we'd need a library for step 5 anyway, and two chart systems is one too many.
- The exact version is pinned and recorded in `DECISIONS.md`.

### 2. Plain JS module, render from data

- `app.js`:
  1. fetches `data/mock-data.json` with a relative URL;
  2. groups indicators by `categories`;
  3. clones a `<template>` tile for each indicator.
- There's no framework. Values are formatted with `Intl.NumberFormat("en")` using `decimals`, and the unit is appended after a thin space ("1.47 °C", "8.14 bn", "98,000 USD").
- Frequency labels come from `cadence` ("Daily", "Annual").
- The header date is the latest `as_of`. ISO strings compare lexically, so `"2026-11-12" > "2025"`.
- Mini chart window:
  - daily tiles show points within 365 days of their last date;
  - annual tiles show the full series.
- Mini chart settings: `animation: false`, no axes, no legend, no tooltips, no points, and the line colour read from the CSS variable `--chart-line`.

### 3. Layout: category groups in a wrapping flex row, fixed-size tiles

- Every tile has the same fixed size, for example 200 × 230 px (final values set in CSS variables).
- Each category group is an inline flex item: its heading sits above its own tiles.
- Groups wrap naturally. Climate (2), Health (2), Living standards (1) and Stability (1) fill the first row on a wide screen, and Economy (5) and Demography (2 plus the empty slot) wrap below. This approximates the wireframe's three rows without hard-coding rows.
- On a phone, tiles go two per row if they fit, otherwise one, so tiles never shrink below their readable size.
- **Rejected alternative:** a fixed row mapping in code. It would be indicator- and category-specific, against "config over code".

### 4. Fonts and privacy

- The page uses the system font stack only, so no font files are needed.
- No cookies, no `localStorage` (until step 4), no third-party URLs anywhere in `site/`.
- The smoke check asserts that every request goes to the page's own origin.

### 5. Data reaches the site through one symlink

- `site/data` is a committed symlink to `../data`. That gives:
  - **local:** running `python -m http.server` in `site/` serves `/data/mock-data.json` directly;
  - **deploy:** the workflow copies with `cp -rL site _site` (dereferencing), then uploads `_site`.
- So the paths are identical locally and live, with one source of the data and no build step.
- **Rejected alternatives:**
  - copying the data into `site/` (two copies drift apart);
  - fetching `../data/` (breaks under the Pages sub-path);
  - an assemble script for local dev (an extra step on every edit).
- **Trade-off:** Windows clones without symlink support break the *local* preview only. Recorded in `DECISIONS.md`.

### 6. `deploy.yml`

- **Triggers:** `push` to `main`, and `workflow_dispatch`.
- **Permissions:** `contents: read`, `pages: write`, `id-token: write`.
- **Concurrency:** group `pages`, `cancel-in-progress: false`, which is GitHub's recommended setting. A run in progress finishes, queued runs collapse to the newest, and the latest commit wins.
- **Steps:**
  1. `actions/checkout`;
  2. assemble `_site`;
  3. `actions/configure-pages`;
  4. `actions/upload-pages-artifact` (path `_site`);
  5. `actions/deploy-pages`, in a `github-pages` environment.
- Pin the current major version of each action, checked at implementation time.
- `_site/` is gitignored.

### 7. Mock data changes keep the other series byte-identical

- The two new daily series use their own `random.Random` instance with a fixed seed. Adding them doesn't shift the shared global random stream, so the other 11 series stay exactly as they are and the diff touches only temperature and CO₂.
- **`temp_anomaly`:**
  - daily for 730 calendar days, ending 2 days before `TODAY` (Climate Pulse's lag);
  - level about 1.3–1.6 °C with a mild seasonal swing and day-to-day autocorrelated noise;
  - the source changes to Copernicus Climate Pulse (the planned real source);
  - the existing caveat is kept.
- **`co2_ppm`:**
  - 730 days ending 1 day before `TODAY`;
  - trend about +2.5 ppm per year plus a seasonal cycle of about ±3.5 ppm peaking in May, so the latest value is around 424–428 ppm;
  - a few dropped days to mimic real gaps;
  - 2 decimals;
  - source "NOAA GML (Mauna Loa)" with the GML trends URL.
- The generator's printed summary keeps working.

### 8. Smoke check `tests/smoke_page.mjs` (Playwright, already installed here)

It takes a URL and runs these checks:
- exactly 13 `.tile` elements;
- no console errors;
- every request goes to the page's own origin, and no cookies are set;
- all tiles have the same bounding box;
- no horizontal scroll at 360 px width;
- the error path, by serving the page with the data request blocked.

It saves desktop and phone screenshots for review. We run it locally before merging, and again against the live URL after deploy (CLAUDE.md step-end check).

## Risks / Trade-offs

- [The Pages source is not set to "GitHub Actions" when the first workflow runs] → I'll tell you the setting before merging. If the run fails, re-run it with `workflow_dispatch` after changing the setting.
- [Symlink behaviour on Windows or in `upload-pages-artifact`] → The workflow dereferences with `cp -L` before uploading. The smoke check against the live URL confirms `/data/mock-data.json` is served.
- [Chart.js draws 13 canvases at once and the page feels slow on old phones] → Animations are off and only small datasets are drawn (≤ 262 points per tile). Acceptable for the MVP.
- [Fixed tile size clips long text] → Titles are kept short (already true in the data). The definition line uses ellipsis plus a `title` attribute so it can't overflow. The smoke check asserts there's no overflow.
- [The private repo has no Pages on a free plan] → Pages on a private repo needs a paid plan. If the repo is private and on the free plan, you'll need to make it public or upgrade. Visibility is your call.

## Migration Plan

1. Merge to `main`.
2. `deploy.yml` publishes the site.
3. Run the smoke check against `https://nicolaiengel.github.io/world-dashboard/`.
4. **Rollback:** revert the merge commit on `main`. The workflow redeploys the previous state. Before this step nothing was online, so a failed first deploy affects no one.

## Open Questions

These don't change the build. I'll log them in `DECISIONS.md` with the default I chose.

- `CLAUDE.md` says `schema_version: 1`, but the file and the generator use `2`. **Default:** keep `2` (the file is authoritative, and CLAUDE.md says don't change the format), and fix the CLAUDE.md wording if you agree.
- The mock `btc_usd` source is CoinGecko, while the planned browser source is Coinbase. The FX source URL is `frankfurter.app`, while CLAUDE.md names `api.frankfurter.dev`. **Default:** leave them as they are in step 2 (they're outside the two approved data changes) and correct them in step 4 when the real sources land.
