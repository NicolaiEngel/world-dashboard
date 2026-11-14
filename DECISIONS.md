# Decisions

Source choices, fallbacks in use, and open questions. Newest entries go at the top of each section.

## Decisions

### Step 2: static page and first deployment (2026-11-14)

- **Chart library: Chart.js 4.6.1**, UMD build, vendored at `site/vendor/chart.umd.min.js`. Its MIT licence is in `site/vendor/chart.js-LICENSE.md` and in the file header.
  - Why: a single file with no dependencies, it works from a plain `<script>` tag, and it can also draw step 5's long-run charts with axes.
  - Rejected: Observable Plot (needs d3 as well) and hand-drawn SVG (we'd need a second chart system for step 5).
- **No build step.** The page is plain HTML/CSS/JS. Fonts are the system font stack only, so there are no font files and no font CDN.
- **Privacy:** on load, the page requests only its own origin. No cookies, no `localStorage`, no analytics. `tests/smoke_page.mjs` checks this.
- **Data on the site: `site/data` is a committed symlink to `../data`.**
  - Locally, `python -m http.server` in `site/` serves `/data/mock-data.json` with no build step.
  - The deploy workflow copies with `cp -rL site _site`, which turns the symlink into real files, and publishes `_site`. The local preview and the live site have identical paths.
  - Caveat: on Windows clones without symlink support, `site/data` becomes a small text file and the *local* preview can't load data. Deployment isn't affected. Fix for Windows users: enable `core.symlinks`, or copy `data/` into `site/data/` locally (and don't commit it).
- **Deployment: `.github/workflows/deploy.yml`.**
  - Runs on push to `main` and on manual dispatch.
  - Uses the official Pages actions (`checkout@v5`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`).
  - Concurrency group `pages`, so the newest commit wins.
  - It needs one repo setting: **Settings → Pages → Source: "GitHub Actions"**.
  - It's replaced by `build-and-deploy.yml` after the MVP.
- **Mock data changes (approved):**
  - `temp_anomaly` is now daily: 730 days ending 2 days ago, source Copernicus Climate Pulse.
  - New `co2_ppm`: daily, ending yesterday, about 3% of days missing, source NOAA GML Mauna Loa.
  - Both use their own seeded random generator, so the other 11 series are byte-identical to step 1's.
  - The generator still computes the old annual temperature series, only to keep the shared random stream unchanged.
- **Tile layout:**
  - Category groups flow in a wrapping row. Tiles have a fixed size (212 × 236 px on desktop) and go two per row on phones.
  - Titles and definitions may wrap onto two lines, and a long unit drops below the number. Nothing is cut off, except long source names in the footer, which end with "…" and stay clickable.
  - An empty dashed slot after the last group stands for later indicators.
- **Header date** = the most recent `as_of` across all indicators.

## Fallbacks in use

None yet. All tiles show mock data.

## Open questions

- **`schema_version`:** CLAUDE.md says `schema_version: 1`, but the data file and the generator use `2`. Decision (approved 2026-11-14): keep `2`. CLAUDE.md's wording still needs updating.
- **Mock source labels:** the mock `btc_usd` lists CoinGecko, but the planned browser source is Coinbase. The FX source URL is `frankfurter.app`, but CLAUDE.md names `api.frankfurter.dev`. Decision (approved): leave as is until step 4 replaces them with the real sources.
- **Action versions:** the workflow pins the major versions current when it was written. Consider Dependabot for `github-actions` once the repo is public.
