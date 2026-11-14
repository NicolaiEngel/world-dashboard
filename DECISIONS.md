# Decisions

Source choices, fallbacks in use, and open questions. Newest entries go at the top of each section.

## Decisions

### Economy first, no header date (2026-11-14)

- **Category order:** Economy, Climate, Health, Living standards, Stability, Demography. Economy holds the tiles that change between visits, so it comes first. This departs from the wireframe's row plan, which put it second; CLAUDE.md is updated to match.
- **No header date:** "Data as of …" is removed from the header. Every tile shows its own date, and one page-wide date was misleading when tiles range from yesterday to 2022. The header keeps the title and the placeholder icons.

### Tile revisions: MOCK badge, chart axes, no placeholder (2026-11-14)

- **MOCK badge, moved forward from step 3.**
  - Every tile whose indicator has `mock: true` shows a neutral grey "MOCK" pill, which disappears automatically once a tile has real data.
  - It has a `title` tooltip and visually hidden text, so screen readers announce "illustrative mock data, not real values".
  - On desktop the pill sits to the right of the title. On phones (≤ 520 px) it sits on its own line above the title, because beside the title it squeezed words like "Temperature" into mid-word breaks.
  - Step 3 keeps the change line and the "x of 13 live" count.
- **Axes on the mini charts.**
  - The value axis has at most 3 ticks in compact form ("1.5", "425", "100K").
  - It fits the plotted range instead of starting at zero, so recent movement stays visible; the tick labels make the range explicit.
  - The date axis shows the first and last point (plus the middle one on wider charts): years on annual tiles, "Nov 2026"-style months on daily tiles.
  - It's a category axis with no date adapter, so gaps such as weekends and missing CO₂ days aren't spaced in time. Good enough for a mini chart; the step 5 detail chart can use a time scale.
  - Still no tooltips.
- **Taller tiles so the axes fit:** 272 px on desktop (was 236) and 250 px on phones (was 214). Widths are unchanged, and the text didn't shrink.
- **Empty placeholder slot removed.** It read as unfinished on a public page. New indicators simply appear as tiles.

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

## Data sources and licences

The licence gate (see CLAUDE.md, "Licence-cleared sources only"). Checked 2026-11-14; the rest gets completed in `add-real-data-fetchers`.

| Source | Used for | Status | Required attribution | Evidence |
|---|---|---|---|---|
| ECB reference rates via Frankfurter | `eur_usd`, `usd_cny` | ✓ | Cite the ECB as the source | [ECB disclaimer](https://www.ecb.europa.eu/services/disclaimer/html/index.en.html): "users of this website may make free use of the information … the ECB must be cited as the source." [Frankfurter](https://frankfurter.dev): free, including commercial use; provider queries are "subject to each provider's terms" |
| UCDP via Our World in Data | `conflict_deaths` | ✓ | UCDP and OWID | [UCDP downloads](https://ucdp.uu.se/downloads/): "All datasets are free of charge and licensed under CC BY 4." [OWID FAQ](https://ourworldindata.org/faqs): charts are CC BY; respect third-party terms |
| CoinGecko (keyless API) | `btc_usd` | ✓, browser confirmation of the full API terms pending | "CoinGecko", with a link | [Keyless API docs](https://docs.coingecko.com/docs/keyless-public-api): "If you display data from CoinGecko … keyless endpoints in your … website … you are required to provide appropriate attribution." The API terms page blocks automated reads (403) |
| IMF World Economic Outlook | `gdp_growth_advanced`, `gdp_growth_developing` | ✓ with attribution, browser confirmation pending | "Source: International Monetary Fund, World Economic Outlook database" | [IMF Copyright and Usage](https://www.imf.org/en/about/copyright-and-terms), read via search excerpts because imf.org blocks automated reads (403): statistical data may be "downloaded, copied, adapted, published, and distributed" with attribution; altered data must be flagged; commercial reuse needs permission. **Caveats:** "bulk downloads by automated means" need permission, and the DataMapper API refused a request from the dev container. Test from a GitHub runner; the fallback is World Bank GDP growth (HIC/LMY, CC BY 4.0) |
| World Bank | 5 annual tiles | To confirm per indicator | — | Site terms defer to the Data Catalog's dataset licence |
| Copernicus Climate Pulse | `temp_anomaly` | To confirm | Copernicus Climate Change Service | — |
| NOAA GML | `co2_ppm` | To confirm | — | — |
| MSCI index levels | (dropped) | ✗ | — | [MSCI index terms](https://www.msci.com/legal/index-terms): "Reproduction, redistribution or any other form of copying or transmission of the Data without MSCI's prior written consent is strictly prohibited." |
| Coinbase market data | (not used) | ✗ not confirmed | — | The terms page blocks automated reads (403); an older version restricted display to third parties |

## Fallbacks in use

None yet. All tiles show mock data.

## Open questions

- **`schema_version`:** CLAUDE.md says `schema_version: 1`, but the data file and the generator use `2`. Decision (approved 2026-11-14): keep `2`. CLAUDE.md's wording still needs updating.
- **Mock source labels:** the mock `btc_usd` lists CoinGecko, but the planned browser source is Coinbase. The FX source URL is `frankfurter.app`, but CLAUDE.md names `api.frankfurter.dev`. Decision (approved): leave as is until step 4 replaces them with the real sources.
- **Action versions:** the workflow pins the major versions current when it was written. Consider Dependabot for `github-actions` once the repo is public.
