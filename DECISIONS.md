# Decisions

Source choices, fallbacks in use, and open questions. Newest entries go at the top of each section.

## Decisions

### Step 6: final check of the live page (2026-11-14)

**Audit** of https://nicolaiengel.github.io/world-dashboard/:
- **Widths tested:** 1440, 1280, 768 and 390 px.
- **Accessibility:** axe-core 4.10.3 (WCAG 2 A/AA plus best practices), run in the browser with no outside calls: **no violations**.
- **Requests on load:** own origin only: `index.html`, `styles.css`, `app.js`, `realtime.js`, `expand.js`, `vendor/chart.umd.min.js`, `data/dashboard.json`.
- **Size and speed:** about 100 KB transferred (Chart.js 72 KB, data 20 KB); load about 1–1.5 s.
- **Layout:** all 13 tiles identical in size at every width, no horizontal scroll.

**Fixes:**

| Finding | Fix |
|---|---|
| The expand button covered the newest points of rising charts | Moved into the tile's value row; the smoke check asserts it never intersects the plot area (1440 and 360 px) |
| Phone header was about 130 px tall: the real-time label wrapped and the icons took a third row | At ≤ 520 px the icons share the title row and the label is "Real-time rates (Frankfurter)". The `aria-label` keeps the full text. The header is now 90 px at 360 px |
| No favicon: a 404 request for `/favicon.ico` on every visit | Inline SVG favicon as a `data:` URI, so no request |
| Deploy warned that Node.js 20 actions are deprecated | `setup-python@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`. These versions were taken from several public upgrade PRs (not the actions' own release notes, which this environment can't read) and are confirmed by the deploy run after merge |

### Step 3 dropped, step 5 reduced to an expanded chart (2026-11-14)

- **Step 3 is dropped:** no change line and no "x of 13 live" count.
- **Step 5 is only an expanded chart view, with no generated text:** no definitions or explanatory sentences. The large view shows the tile's full stored series (daily tiles: about 2 years; annual tiles: full history) in a native `<dialog>`, with up to 6 axis labels per axis and the nearest point's date and value on hover or tap. It reuses the tile's chart configuration from `app.js` (`WD.chartConfig`). One chart instance is created per opening and destroyed on close.
- The expand button (⤢) sits in the chart's top-right corner. Clicking anywhere on a mini chart also opens the view.

### Daily refresh (2026-11-14)

- **Schedule:** `deploy.yml` also runs daily at 05:17 UTC, an off-peak minute. Each run tests, fetches and publishes, exactly like a push. The concurrency group `pages` keeps a scheduled run and a push run from publishing out of order.
- **Last-good fallback:**
  - Before fetching, the runner downloads the currently published `data/dashboard.json`. The URL comes from `actions/configure-pages`, so forks use their own site automatically.
  - If a source fails today, the indicator keeps yesterday's published entry unchanged, but only if it was real (`mock: false`) and its latest value still passes the range check. Otherwise it falls back to mock.
  - The tile's date shows how old the data is. The job summary lists "last-good (<as_of>, <reason>)".
- **Keepalive:**
  - A separate job, which runs only on scheduled runs and only if the repository variable `KEEPALIVE` is `true`. Forks don't inherit it.
  - It calls `PUT /repos/{owner}/{repo}/actions/workflows/deploy.yml/enable` with the built-in token (`actions: write` for that job only). No commits, no third-party action.
  - **Caveat:** GitHub doesn't document that re-enabling resets the 60-day inactivity timer ([docs](https://docs.github.com/actions/managing-workflow-runs/disabling-and-enabling-a-workflow)). Users report it works ([discussion #184653](https://github.com/orgs/community/discussions/184653)). The popular `keepalive-workflow` action's API mode uses the same call, so switching to it would add third-party code without more certainty. If the schedule is disabled anyway, GitHub emails the owner; re-enable it in the Actions tab.

### Real data, MVP step 4 (2026-11-14)

- **Pipeline:** `python -m pipeline.run` merges fetched data onto `data/mock-data.json` and writes `data/dashboard.json`, which isn't committed. The deploy workflow runs `pytest`, then the runner, then publishes. A source that fails, or whose value fails its range check, leaves that tile mocked; the job summary says why.
- **Licence gate:** `pipeline/indicators.py` has `licence_cleared` per indicator; see the table below.
- **GDP tiles instead of MSCI:** MSCI forbids redistribution, so Economy shows real GDP growth from the World Bank: "High-income economies" (HIC) vs "Low & middle income" (LMY). The IMF's advanced vs emerging & developing split, with a current-year estimate, is the later upgrade, once the IMF permits automated downloads.
- **Bitcoin stays mock:** CoinGecko's storage and user-agreement conditions aren't met yet (see the table).
- **Temperature baseline:** Climate Pulse publishes anomalies vs 1991–2020 only. The tile shows `ano_91-20 + 0.88 °C`, C3S's documented 1991–2020 → 1850–1900 offset (best estimate 0.88, range 0.72–0.99; reliable for annual means, daily offsets 0.79–0.97). The caveat says so. Source: C3S practice since 2021 (e.g. [Global Climate Highlights 2024](https://climate.copernicus.eu/global-climate-highlights-2024): 2024 was 0.72 °C above 1991–2020 and 1.60 °C above 1850–1900).
- **Conflict deaths from 1989:** UCDP years only (see the table).
- **Real-time:** an opt-in header button fetches the latest ECB rates from Frankfurter once (v2 API, `providers=ECB`, 5 s timeout). Bitcoin isn't real-time. The choice is stored in `localStorage` under `wd.realtime`. Frankfurter sends `access-control-allow-origin: *`.
- **Attribution visible:** the tile's source line may wrap to two lines instead of being cut off.
- **Tests:** `tests/test_*.py` use small fixtures recorded from real responses by `scripts/record_fixtures.py`. Test variants (a flagged NOAA value, a `nonRedistributable` flag) are derived from real fixtures inside the tests, never invented as files.

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

The licence gate (CLAUDE.md, "Licence-cleared sources only"). Checked 2026-11-14.

| Source | Used for | Status | Attribution shown | Evidence |
|---|---|---|---|---|
| World Bank WDI | `child_mortality`, `life_expectancy`, `drinking_water`, `population`, `fertility`, `gdp_growth_advanced` (HIC), `gdp_growth_developing` (LMY) | ✓ CC BY 4.0 | "World Bank" + link | The WDI catalog entry: "License: Creative Commons Attribution 4.0". The API metadata for each series used (`SH.DYN.MORT`, `SP.DYN.LE00.IN`, `SH.H2O.SMDW.ZS`, `SP.POP.TOTL`, `SP.DYN.TFRT.IN`, `NY.GDP.MKTP.KD.ZG`): `License_Type = CC BY-4.0` ([public licences](https://datacatalog.worldbank.org/public-licenses#cc-by)) |
| ECB reference rates via Frankfurter (ECB provider only) | `eur_usd`, `usd_cny`, plus opt-in real-time | ✓ | "ECB via Frankfurter", linked to the ECB rates page | [ECB disclaimer](https://www.ecb.europa.eu/services/disclaimer/html/index.en.html): "users of this website may make free use of the information … the ECB must be cited as the source." [Frankfurter](https://frankfurter.dev): "Is the API free for commercial use? Yes."; provider queries are "subject to each provider's terms" |
| Copernicus Climate Pulse (ERA5) | `temp_anomaly` | ✓ Copernicus Licence | "Copernicus Climate Change Service (C3S)" + link; the caveat reads "Generated using Copernicus Climate Change Service information <year>" | [Licence to Use Copernicus Products](https://climate.copernicus.eu/sites/default/files/2025-04/licence-to-use-copernicus-products.pdf), §4: access "for any purpose in so far as it is lawful … reproduction; distribution; communication to the public; adaptation"; §5.1: "clear and visible attribution to the Copernicus programme" |
| NOAA GML, Mauna Loa | `co2_ppm` | ✓ | "NOAA GML, Mauna Loa" + link | CSV header: "These data are made freely available to the public and the scientific community … please include relevant citation text" |
| UCDP via Our World in Data | `conflict_deaths` (1989 onwards) | ✓ CC BY 4.0 | "UCDP via Our World in Data" + link | [UCDP](https://ucdp.uu.se/downloads/): "All datasets are free of charge and licensed under CC BY 4." [OWID](https://ourworldindata.org/faqs): charts CC BY; respect third-party terms. Pre-1989 World values come from PRIO (licence not checked), so they're dropped |
| IMF World Economic Outlook | — (later upgrade for the GDP tiles) | Display ✓; automated fetching needs permission | — | [IMF Copyright and Usage](https://www.imf.org/en/about/copyright-and-terms), effective 11 Oct 2024 (PDF provided by Nicolai): "You may download, extract, copy, create derivative works, publish, distribute, and use Data", with "Source: International Monetary Fund, Database Name, <link>". But: "Permission is required to copy or download IMF Content in any systematic way" and "The IMF prohibits the bulk download of information by automated technology without explicit permission." imf.org refused automated requests (403). Next step: ask copyright@imf.org |
| CoinGecko API | — (`btc_usd` stays mock) | Display ✓ with conditions not yet met | — | API Terms of Service, 5 Sept 2025 (PDF provided by Nicolai): §4.3 requires "Powered by CoinGecko"; §6 "We do not encourage caching or storage of Data", refresh at least every 24 h, "strong encryption … should be applied to stored Data"; §7 requires a user agreement and privacy policy with specific clauses. Revisit after the daily refresh and the legal pages exist |
| MSCI index levels | (dropped) | ✗ | — | [MSCI index terms](https://www.msci.com/legal/index-terms): "Reproduction, redistribution or any other form of copying or transmission of the Data without MSCI's prior written consent is strictly prohibited." |
| Coinbase market data | (not used) | ✗ not confirmed | — | The terms page blocks automated reads (403); an older version restricted display to third parties |

## Fallbacks in use

None yet. All tiles show mock data.

## Open questions

- **`schema_version`:** CLAUDE.md says `schema_version: 1`, but the data file and the generator use `2`. Decision (approved 2026-11-14): keep `2`. CLAUDE.md's wording still needs updating.
- **Mock source labels:** the mock `btc_usd` lists CoinGecko, but the planned browser source is Coinbase. The FX source URL is `frankfurter.app`, but CLAUDE.md names `api.frankfurter.dev`. Decision (approved): leave as is until step 4 replaces them with the real sources.
- **Action versions:** the workflow pins the major versions current when it was written. Consider Dependabot for `github-actions` once the repo is public.
