# World Dashboard

A single page that shows the state of the world at a glance: 13 global indicators covering climate, health, living standards, stability, the economy and demography.

**Work in progress:** every tile currently shows clearly labelled mock data. Real data arrives tile by tile. A full README with a "Make your own" guide comes later.

## Run locally

```bash
cd site && python -m http.server
```

Open http://localhost:8000/. `site/data` is a symlink to `../data`, so the page reads `data/mock-data.json`.

To regenerate the mock data:

```bash
python scripts/make_mock_data.py
```

## Smoke check

The check needs Node and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`). With the local server running:

```bash
node tests/smoke_page.mjs http://localhost:8000/
```

It checks the tile count, category order, uniform tile size, values, that only the page's own origin is contacted, the phone layout and the data-load error path. It also saves screenshots to `test-results/`. Run it against the live URL after each deploy as well.

## Deployment

Every push to `main` publishes `site/` plus the data file to GitHub Pages through `.github/workflows/deploy.yml`. This needs one setting: Settings → Pages → Source: "GitHub Actions".

See `DECISIONS.md` for the design choices and open questions, and `CLAUDE.md` for the plan.
