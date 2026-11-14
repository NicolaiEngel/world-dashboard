# Proposal: Static dashboard page on mock data, deployed to GitHub Pages

## Why

Step 1 left us with mock data and a wireframe but nothing to look at. Step 2 turns the mock data into a page that looks like the dashboard and puts it online, so every later step lands on a live, demoable prototype (MVP plan, step 2: "It looks like a dashboard").

## What Changes

- **Mock data (two approved changes):** in `scripts/make_mock_data.py`, switch `temp_anomaly` to `cadence: "daily"` with about 2 years of plausible daily values, and add a daily `co2_ppm` indicator (Climate, unit "ppm", seasonal cycle, source NOAA GML Mauna Loa). Regenerate `data/mock-data.json`. That makes 13 indicators. No other format changes.
- **Static page in `site/`:** `index.html`, `app.js` and `styles.css`, with no build step. The page reads the mock data file and renders:
  - a header with the title, the data date and the placeholder icons 🌐 ✏️ 👤;
  - the category headings, in data order;
  - 13 identical tiles. Each tile shows its title, one-line definition, big value, mini chart and a footer with frequency, date and source link.
  - Light mode only. All colours are CSS variables. The page works on a phone.
- **Chart library vendored** in `site/vendor/`. No CDN, no web fonts. On load, the page contacts only its own origin.
- **Deploy workflow** `.github/workflows/deploy.yml`: on every push to `main`, and on manual dispatch, it publishes `site/` plus the data file to GitHub Pages with the official Pages actions.
- **`DECISIONS.md`** is started, recording the choices made here and the open questions.
- **Not in this step:** the change line, MOCK badges and "x of 13 live" count (step 3); real data and the real-time opt-in (step 4); the detail view (step 5); dark mode.

## Capabilities

### New Capabilities

- `mock-data`: the mock data file and its generator. Covers which indicators exist, their cadence and the shape the page relies on.
- `dashboard-page`: what the single page shows. Covers the header, category groups, the identical tile format, neutral styling, the responsive layout and the "own origin only" privacy rule.
- `site-deployment`: how the page and its data get published to GitHub Pages on every push to `main`.

### Modified Capabilities

None. There are no existing specs.

## Impact

- **New files:**
  - `site/index.html`, `site/app.js`, `site/styles.css`;
  - `site/vendor/<chart library>`;
  - `.github/workflows/deploy.yml`;
  - `DECISIONS.md`, `.gitignore`.
- **Changed files:** `scripts/make_mock_data.py` and the regenerated `data/mock-data.json`.
- **Repo setting (yours to change before merge):** Settings → Pages → Source: "GitHub Actions".
- **Hosting:** once merged, the site is public at `https://nicolaiengel.github.io/world-dashboard/`.
