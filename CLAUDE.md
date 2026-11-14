# World Dashboard: instructions for Claude Code

## Goal

A single-page dashboard you can open every day to see the state of the world at a glance. It shows a small set of global indicators covering the planet, people, economy and conflict. Each indicator gets a card with its latest value, recent trend, how old the data is, and its source.

For now it is a personal project for two friends. It must be **publishable as an open template**: anyone should be able to fork the repo, choose their own indicators and wording by editing config files (no code changes for common cases), and have their own copy running for free within minutes. Every design choice should make that easy.

**Today's target is an MVP, built in a one-day vibe-coding workshop.** The "MVP plan" section is what to build now. The Architecture, Configuration and community sections describe where the project goes *after* the MVP. Don't build those parts today, but don't make choices that block them either.

## How we work: OpenSpec (spec-driven development)

We use [OpenSpec](https://github.com/Fission-AI/OpenSpec) so that we agree on what to build before code is written, and so that the reasoning lives in the repo, not in chat.

1. OpenSpec is already set up in this repo. Its skills are in `.claude/skills/`: use `/openspec-propose` and the matching apply and archive skills. If `openspec/config.yaml` has no project context yet, copy the **Goal** and **Principles** sections of this file into its `context:` field.
2. Build each MVP step below as one OpenSpec change. Keep proposals short, because this is a one-day workshop. Run `/openspec-propose` and **stop so we can review the proposal**. Implement it only after we approve, verify the result, then archive the change.
3. This CLAUDE.md holds the standing rules. Once archived, the specs in `openspec/specs/` describe what the system does. If the two ever conflict, ask us rather than picking one.

## Principles

- **Config over code.** Indicators, sections, titles and site settings live in YAML config. Adding an indicator from a supported source type should take a config entry only.
- **Open, documented formats.** The config files and the data files each have a published JSON Schema in `schema/`. The generated data is served at `/data/*.json` on the site, so others can reuse it.
- **Fetched, never typed in.** Every real value comes from an automated fetch of a public source. No hand-entered numbers. The only exception is the MVP's mock data, which is always labelled MOCK on the page. If an indicator has no fetchable source, leave it out and record that in `DECISIONS.md`.
- **Licence-cleared sources only.** Fetch a source only after its terms have been read and confirm that public display on this site is allowed. Record the terms URL, the decisive quote, the licence and the required attribution in `DECISIONS.md`, and show that attribution on the tile. A source whose terms forbid redistribution, or can't be confirmed, isn't used; its tile stays MOCK or is replaced. (This is why MSCI index data and Coinbase market data aren't used.)
- **Honest about data age.** Most indicators are annual and years old. Never make annual data look live.
- **Neutral presentation.** No colour coding of "good" or "bad" changes. Show the direction and size of a change in the same neutral style for every indicator.
- **Free to run.** Default setup needs no paid services and no API keys.
- **Privacy by default.** The site is public from its first deployment, and the operators are in Germany, so this applies from step 2. When the page loads, the browser contacts **only our own site**.
  - Ship the chart library and any fonts as files inside `site/vendor/`, never from a CDN or Google Fonts.
  - No analytics, no tracking, no embedded third-party widgets, no cookies.
  - Calls to outside data sources from the browser happen only after the visitor explicitly asks for them (see "Real-time data in the browser").
  - Reason: a visitor's IP address counts as personal data. LG München I (20.01.2022, 3 O 17493/20) awarded damages for sending visitors' IPs to Google via embedded fonts without consent.
- **Real-time where it scales, stored data everywhere else.** See "Real-time data in the browser".

## MVP plan (today): each step is one OpenSpec change

**The rule: the dashboard can be demoed after every step.** Build the UI first on mock data. Then real data replaces the mocks one tile at a time, so a source that fails just leaves its tile mocked instead of breaking the demo.

**There is a working prototype online at all times.** The first deployment to GitHub Pages happens in step 2, and from then on every step ends with a deployment:
1. Merge the step to `main`.
2. The deploy workflow publishes it.
3. Open the live URL and confirm the page loads, all 13 tiles render, and the browser console shows no errors.
4. Only then start the next step.

If a deployment breaks the live page, fixing or reverting it comes before any new work. Report the live URL at the end of every step.

**The MVP in one sentence:** a single page where you can see in 10 seconds how the world is doing. It has 13 identical tiles grouped by category, each showing its value, its change, a mini chart, the date and the source.

**What moves daily, and what doesn't.** Five tiles change every day:
- FX (EUR/USD, USD/CNY) and Bitcoin;
- **daily** global temperature;
- **daily** CO₂ concentration.

These give the page its daily pulse, the way an energy monitor feels "live". The other eight tiles (GDP growth for advanced and for emerging & developing economies, child mortality, life expectancy, drinking water, population, fertility, conflict deaths) are annual by nature: they come from registries and surveys and are published 1–3 years late. Don't dress them up as daily. They show their update frequency and date clearly, and they're there for long-run context.

**Data contract:** `data/mock-data.json` (`schema_version: 2`, made by `scripts/make_mock_data.py`) defines the format.
- **Top level:** `categories` (in display order) and a list of `indicators`.
- **Each indicator:** `id`, `title`, `subtitle` (the one-line definition), `category`, `cadence` (`daily` or `annual`), `unit`, `decimals`, `source` (name and url), `as_of`, `mock`, an optional `caveat`, and `series` (a list of date/value pairs).
- **Real fetchers** emit exactly the same format with `mock: false`. Don't change the format during the MVP without asking us.
- **Two approved changes to the existing mock data.** Make them in `scripts/make_mock_data.py` in step 2, then regenerate:
  - change `temp_anomaly` to `cadence: "daily"`, with about 2 years of plausible daily values;
  - add a `co2_ppm` indicator in category Climate: daily, unit "ppm", about 2 years of values with the seasonal cycle, `source` NOAA GML Mauna Loa.
- **If these files aren't in the repo yet,** ask Nicolai for them. Don't regenerate them with a different format.

| # | What you can demo afterwards | Time | What gets built |
|---|---|---|---|
| 1 | **A sketch of the page** | done | Wireframe (FigJam, Implementation Steps page) plus the mock data file and its generator. Only check that both are in the repo. |
| 2 | **"It looks like a dashboard"** | ~75 min | A static page in `site/` (`index.html` + JS + CSS, no build step, chart library vendored in `site/vendor/`) that reads `mock-data.json`. It renders the header, the category headings and the 13 identical tiles from the wireframe, each with its value, mini chart, frequency, date and source link, in light mode. Most of the layout and styling work happens here. **Also add the deploy workflow** (`.github/workflows/deploy.yml`): on every push to `main` it publishes `site/`, plus the data file, to GitHub Pages using the official Pages actions. Before merging, tell us the one setting to change (Settings → Pages → Source: "GitHub Actions"). **Milestone: first version online.** |
| 3 | **"I can see the trend at a glance"** | ~30 min | The change line on every tile (plain grey; comparison rules under Site design) and the "x of 13 live" count in the header. (The MOCK badges were already added after step 2.) Compute the count from the data, don't hard-code it. **Milestone: the complete experience exists, all on mock numbers.** |
| 4 | **"The numbers are real"** | ~2 h | Replace the mocks tile by tile, highest visibility first: **(a)** exchange rates, fetched **in real time in the browser behind the opt-in control** (see "Real-time data in the browser"), plus their stored daily series, and Bitcoin's daily series from CoinGecko; **(b)** the World Bank tiles (child mortality, life expectancy, drinking water, population, fertility), where one generic fetcher fills all five; **(c)** daily temperature (Copernicus Climate Pulse), daily CO₂ (NOAA GML) and conflict deaths (Our World in Data); **(d)** GDP growth for advanced and for emerging & developing economies (IMF World Economic Outlook), replacing the MSCI tiles. The fetchers run in every deploy (and by hand with `python -m pipeline.run`) and write `data/dashboard.json`, which isn't committed; the page falls back to `data/mock-data.json`. **Time-box each tile to about 15 minutes.** A tile that still misbehaves keeps its mock data and MOCK badge, gets a note in `DECISIONS.md`, and you move on. |
| 5 | **"Tell me more"** | ~45 min | Clicking a tile opens the long-run chart, a sentence on what the indicator means, and its caveats (e.g. the Paris temperature definition). |
| 6 | **"Here's the link"** | ~30 min | It's already online, so this step is a final check of the live page (phone and desktop, all tiles, the real-time values, the detail view), fixes for anything that looks off, and a demo run-through. |

**Extras, only if time is left, in roughly this order:**
- a daily automatic refresh through a scheduled GitHub Actions run (see Architecture);
- the other parked indicators;
- a better biodiversity measure;
- dark mode (a second set of CSS colour variables plus a toggle);
- a "Today / This year / Long run" switch that changes which comparison every tile shows;
- country filters.

## After the MVP

1. **Automation:** move to the config-driven pipeline and the single build-and-deploy workflow described under Architecture, with the last-good fallback and keepalive. That workflow replaces the MVP's `deploy.yml`.
2. **All indicators:** add the parked indicators a few at a time, each with tests.
3. **Ready to publish:** work through "Before going public", then the README with the "Make your own" guide, SPEC.md, CONTRIBUTING.md, LICENSE, and a final pass on `DECISIONS.md`.

## Architecture (after the MVP)

During the MVP, keep it simple:
- a static page that reads one data file: `data/dashboard.json` (real data, same format as the mock file), falling back to `data/mock-data.json`;
- small Python fetchers in `pipeline/` that run during each deploy (or by hand) and write that file;
- a simple deploy workflow that publishes `site/` to GitHub Pages on every push to `main`, from step 2 on. The daily scheduled refresh comes later.

The architecture below is the target once the MVP works.

### Pipeline (`pipeline/`, Python 3.12)

- **Source adapters** live in `pipeline/adapters/`, one per *source type*: `world_bank`, `owid`, `ecb`, `un_sdg`, `market_csv`, and `custom` for one-off cases. Each adapter takes the params from an indicator's config entry and returns a normalised series.
- **`pipeline/run.py`** reads `config/indicators.yaml`, runs each indicator through its adapter, validates the result, writes `data/<id>.json`, and writes `data/manifest.json` with the status of every indicator.
- **Last-good fallback:** at the start of each run, download the currently published `data/*.json` from the live site (its URL is in `config/dashboard.yaml`). If an indicator fails to fetch or fails validation, republish its previous file with `status: "error"` and carry on with the others.

### Automation: one GitHub Actions workflow (`.github/workflows/build-and-deploy.yml`)

- It runs on a daily `schedule`, on `push` to `main`, and on `workflow_dispatch`. Schedule it for an off-peak minute such as `17 5 * * *` UTC.
- Its steps are: fetch → validate → test → assemble `site/` with the data → deploy to GitHub Pages using the official Pages actions (`upload-pages-artifact` and `deploy-pages`, with the Pages source set to "GitHub Actions").
- **Data is not committed to the repo.** That keeps the repo history clean, so forks get code without years of data commits.
- GitHub turns off scheduled workflows in public repos after 60 days with no repository activity. Prevent this with a keepalive step that uses the API rather than dummy commits (e.g. `gautamkrishnar/keepalive-workflow` in API mode, or an equivalent). The step should run only in the repo where it's set up, not silently in every fork.
- Print a run summary listing which indicators succeeded, which fell back, and why.

### Real-time data in the browser

Some tiles can fetch their value directly from the source in the visitor's browser, so they're up to date to the minute. This scales because each visitor calls the source from their own connection, so per-IP limits apply per visitor, not to the whole site. It is allowed only for sources that meet **all** of these conditions:

1. **No API key.** A key in browser code is public.
2. **The source allows cross-origin (CORS) requests from browsers.**
3. **Limits are per IP or "fair use".** No site-wide monthly quota that a popular fork could use up.
4. **The terms allow showing the data on a public page**, with attribution if required.
5. **The source actually updates more often than our daily refresh.** Otherwise real-time fetching adds nothing.

How it works:
- The page **always loads the stored data first**: mock data in the MVP, the daily snapshot later. Nothing is fetched from outside sources by default.
- **Opt-in only:** a small, clearly worded control in the header: "Load real-time exchange rates (connects to Frankfurter)". Only after the visitor clicks it does the page fetch real-time values for eligible tiles. The choice may be remembered in `localStorage` so a returning visitor doesn't have to click again. Provide a way to switch it off.
- If a real-time fetch fails or times out (about 5 seconds), the tile keeps the stored value. Nothing breaks.
- **Later alternative:** the scheduled workflow fetches these prices every hour or so and publishes them with the site. Visitors then get near-real-time values without their browser contacting any third party. If we choose this, the opt-in control goes away.
- A tile showing a real-time value says so in its footer, e.g. "Real-time · 14:32". Use the word "real-time" for this, because "live" already means "real data, not mock" in the header count.
- **Be polite to the sources.**
  - Fetch once when real-time is switched on, and once per page load after that. No periodic refresh: ECB rates change once per working day.
  - Avoid duplicate requests by putting all currencies in one call.
- The sparkline and the comparison value come from the stored series. If the source offers history in one cheap call, they can come from there instead.
- Post-MVP config: an optional `realtime:` block on an indicator entry (provider, params, refresh interval). Tiles without it use stored data only.

Classification for the MVP tiles (check CORS and terms live before relying on it):

| Tile | Real-time? | How |
|---|---|---|
| `btc_usd` | No | Daily close from CoinGecko's keyless API in the pipeline, with CoinGecko attribution. Coinbase isn't used: its market-data terms couldn't be confirmed to allow public display. Don't use CoinGecko in the browser: its keyless pool is only a few calls per minute and its docs mention CORS errors |
| `fx_eur_usd`, `fx_usd_cny` | **Yes** | Frankfurter (`api.frankfurter.dev`): keyless, CORS, open source, soft fair-use limits. Request ECB as the provider so values match the ECB reference rates. One call returns both rates, and a range query returns the history. ECB rates update once per working day, so fetch once per page load. Forks with heavy traffic can self-host Frankfurter (Docker) |
| `gdp_growth_advanced`, `gdp_growth_developing` | No | Annual IMF data gains nothing from real-time fetching |
| `temp_anomaly`, `co2_ppm` | Check | Both are daily but published with a lag of about 1–2 days. Fetch them in the browser only if the CSV endpoints meet all five conditions (check CORS especially). Otherwise they come from the fetchers / daily pipeline. Either way the tile is daily |
| all annual tiles | No | Annual data gains nothing from real-time fetching |

### Site (`site/`)

- Static HTML/CSS/JS. Use a charting library (Observable Plot or Chart.js) **vendored as a file in `site/vendor/`**, not loaded from a CDN, and skip the build step unless there's a strong reason. Write any such reason in `DECISIONS.md`.
- The page is built entirely from `config/dashboard.yaml` and `data/manifest.json`. There are no indicator-specific hard-coded parts in the page.

## Configuration: the open spec

### `config/dashboard.yaml`

Holds the title, subtitle, language, site URL, the sections (ordered, each with its list of indicator ids), and the order of tiles within each section.

### `config/indicators.yaml`

One entry per indicator:

```yaml
- id: life_expectancy
  name: Life expectancy at birth
  unit: years
  frequency: annual            # daily | monthly | annual
  definition: Average number of years a newborn would live if current death rates stayed the same.
  caveats: []
  source:
    type: world_bank           # selects the adapter
    params: { indicator: SP.DYN.LE00.IN, country: WLD }
    attribution: UN World Population Prospects via World Bank
    url: https://data.worldbank.org/indicator/SP.DYN.LE00.IN
    license: CC BY 4.0         # verify for each source and record exactly
  checks: { min: 20, max: 100 }   # plausible range; outside it, the value counts as an error
  history: all                 # or e.g. 5y for daily series
```

### `data/<id>.json`

```json
{
  "id": "life_expectancy",
  "name": "Life expectancy at birth",
  "unit": "years",
  "frequency": "annual",
  "definition": "…",
  "caveats": [],
  "source": { "attribution": "…", "url": "…", "license": "…" },
  "fetched_at": "2026-11-14T05:17:00Z",
  "latest": { "date": "2023", "value": 73.2 },
  "series": [ { "date": "1960", "value": 52.6 } ],
  "status": "ok"
}
```

Use ISO dates that match the frequency: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. `status` is `ok`, `stale` or `error`.

Write JSON Schemas for all three files in `schema/`. Validate them in CI, and document them in `docs/SPEC.md` with a worked example of adding an indicator.

## Default indicators

**MVP scope (13 tiles):** `gdp_growth_advanced`, `gdp_growth_developing`, `fx_eur_usd`, `fx_usd_cny`, `btc_usd`, `temp_anomaly`, `co2_ppm`, `child_mortality`, `life_expectancy`, `drinking_water`, `population`, `fertility`, `conflict_deaths`. In the mock data file some ids are spelled differently (`eur_usd`, `usd_cny`), so keep whichever spelling the data file uses. The MSCI World / MSCI EM tiles were dropped: MSCI's terms forbid redistribution of index data without its written consent. All other rows below are parked until after the MVP; on the FigJam board they're marked "⏸ Not in today's MVP".

Before writing an adapter or config entry, check each endpoint live and confirm that it returns world-level data. Docs and URLs drift. If a primary source fails, use the fallback and record it in `DECISIONS.md`. **Never invent or estimate values.**

| id | Indicator | Show | Primary source | Fallback / notes |
|---|---|---|---|---|
| `temp_anomaly` | Temperature above pre-industrial | **Daily** global surface air temperature anomaly vs **1850–1900** (tile). Detail view adds the long-term warming level: the Paris-relevant figure, a multi-decade average or trend, not one day | Copernicus **Climate Pulse** (ERA5): daily global series, about 2 days behind real time, downloadable as CSV. For the long-term level, use the C3S global temperature trend monitor (30-year trend) | **Check the baseline.** Climate Pulse was launched relative to 1991–2020, with 1850–1900 announced for a later update. Use the pre-industrial series if it exists now; otherwise convert using C3S's documented offset (verify the value) and say so in caveats. Never mix baselines silently. A single day is noisy and can sit far above the long-term level, so the caveat must say that Paris refers to long-term averages. Fallback: the monthly ERA5 series (OWID `global-temperature-anomalies-by-month`), labelled monthly |
| `co2_ppm` | CO₂ concentration | **Daily** atmospheric CO₂ at Mauna Loa, ppm | NOAA Global Monitoring Laboratory (GML), Mauna Loa daily means (find the current CSV under the CO₂ trends pages) | Daily values have gaps (instrument or weather), so show the latest available day with its date. Strong seasonal cycle, so compare with the same day a year earlier. Fallback: NOAA monthly means, labelled monthly |
| `child_mortality` | Under-5 mortality | Deaths per 1,000 live births | World Bank `SH.DYN.MORT`, `WLD` (UN IGME) | OWID `child-mortality` |
| `gdp_growth_advanced` | GDP growth, advanced economies | Real GDP growth, % per year, annual from 1980 to the current year | IMF World Economic Outlook, DataMapper API `NGDP_RPCH`, group `ADVEC` | The current year is an IMF estimate: say so in the caveat and name the WEO edition; drop projection years. Licence: confirm the IMF's copyright and usage terms first. Fallback: World Bank `NY.GDP.MKTP.KD.ZG`, `HIC` (CC BY 4.0) |
| `gdp_growth_developing` | GDP growth, emerging & developing economies | As above | IMF WEO, `NGDP_RPCH`, group `OEMDC` | As above. Fallback: World Bank `LMY` |
| `fx_usd_cny` | USD–CNY | Daily, **real-time in browser** | Frankfurter with ECB as provider (browser and pipeline). Pipeline/fallback: ECB data API (`data-api.ecb.europa.eu`, EXR) | The currency is the yuan/renminbi (CNY). ECB rates are EUR-based, so USD/CNY = (EUR/CNY) ÷ (EUR/USD) |
| `fx_eur_usd` | EUR–USD | Daily, **real-time in browser** | As for USD–CNY | |
| `btc_usd` | Bitcoin in USD | Daily close, 1-year chart | CoinGecko keyless API (`market_chart`, 365 days), in the pipeline | Attribution to CoinGecko is required. Read CoinGecko's full API terms in a browser before going real (the page blocks automated reads). Not real-time |
| `amr` | Antibiotic resistance | SDG 3.d.2: % of bloodstream infections due to MRSA and to *E. coli* resistant to 3rd-generation cephalosporins (two series) | UN SDG API (series `SH_BLD_MRSA`, `SH_BLD_ECOLI`), data from WHO GLASS. OWID mirrors it | Use a world aggregate only if the source publishes one. Otherwise show WHO/UN regional values. **Don't compute a world figure ourselves.** Caveat: comes only from reporting countries and isn't fully representative |
| `fertility` | Total fertility rate | Births per woman | World Bank `SP.DYN.TFRT.IN`, `WLD` | UN WPP via OWID |
| `suicide_rate` | Suicide rate | Per 100,000, age-standardised | World Bank `SH.STA.SUIC.P5`, `WLD` (WHO) | Lags several years, so make the "as of" year prominent |
| `median_income` | Global median income | Income or consumption per day, international-$ (2021 PPP) | OWID `daily-median-income`, entity `World` (World Bank PIP) | Mixes income and consumption surveys, so put that in caveats. Don't substitute GDP per capita |
| `education_index` | Education index | UNDP HDR education index (0–1), world | UNDP HDR composite-indices time-series CSV (the file name changes each release, so find the current one programmatically if possible) | OWID mean years of schooling, labelled as a different measure |
| `life_expectancy` | Life expectancy | Years | World Bank `SP.DYN.LE00.IN`, `WLD` | OWID `life-expectancy` |
| `conflict_deaths` | War-related deaths | Annual deaths in organised violence / state-based conflict | UCDP (Uppsala), annual data via OWID's UCDP-based charts | Optional monthly detail from the UCDP API (`ucdpapi.pcr.uu.se`). Check whether it now requires an access token. If it does, it's an optional secret, and the default setup must work without it. Injuries aren't tracked consistently worldwide, so say so rather than building a series. Avoid ACLED (registration required) |
| `pm25` | Pollution | Population-weighted mean PM2.5 exposure, µg/m³ | World Bank `EN.ATM.PM25.MC.M3`, `WLD` | Annual and lagged. Show the WHO guideline value as a reference line (verify the current value) |
| `population` | World population | Total, plus the UN medium projection as a dashed line | OWID `population-unwpp` (UN WPP) | World Bank `SP.POP.TOTL` |
| `drinking_water` | Access to drinking water | % using safely managed drinking water | World Bank `SH.H2O.SMDW.ZS`, `WLD` (WHO/UNICEF JMP) | Optional secondary series: basic access `SH.H2O.BASW.ZS` |
| `biodiversity` | Biodiversity | **Red List Index** (0–1, world) | OWID `red-list-index` (IUCN / BirdLife, SDG 15.5.1) | "Number of known species" grows with discovery, not with biodiversity health, so it's a poor proxy and not used. The Living Planet Index is a possible later addition |

OWID chart API: add `.csv` or `.metadata.json` to a grapher URL, use `?v=1&csvType=full&useColumnShortNames=true`, and send a descriptive `User-Agent`. Skip any OWID chart whose metadata says `nonRedistributable: true`. Copy the attribution and licence from the metadata.

## Site design

The reference is the wireframe on the **Implementation Steps** page of the FigJam board "Wold Dashboard" (`https://www.figma.com/board/6RL68x1YCVLlatUUr3idBF/Wold-Dashboard`). If you have Figma access, check it there. Otherwise:

- **Header:** "World Dashboard" and an "x of 13 live" count. No page-wide data date: every tile shows its own date. The 🌐 ✏️ 👤 icons on the right are placeholders and do nothing yet.
- **Category headings, in this order:** Economy; Climate (temperature, CO₂); Health; Living standards; Stability; Demography. No empty placeholder slot.

  Let the grid wrap naturally rather than shrinking the tiles: all tiles stay the same size.
- **All tiles use one identical format:** the same size; the title with a MOCK badge while the data is mocked; a one-line definition; the big value; the change line; a mini chart; and a footer with update frequency, date and source link. Titles must fit: use short titles such as "Emerging & developing" and put the detail in the definition line.
- **Change line:**
  - FX and Bitcoin compare with the previous day with data;
  - **temperature and CO₂ compare with the same day one year earlier**, because day-to-day changes in these are weather or seasonal noise;
  - annual tiles compare with 10 years earlier;
  - a real-time value compares with the last stored daily close.
  Write the comparison into the change line, e.g. "+0.21 °C vs same day 2025".
- **Neutral colours:** no good/bad colouring. The change line is plain grey and every mini chart is the same blue.
- **Mini charts** have labelled value and date axes (a few compact ticks each), no tooltips.
- **Light mode only for the MVP.** Ignore the dark styling in the wireframe and the Design Vision Board. Dark mode is a later feature. Keep all colours in CSS variables from the start, so adding a dark theme later (and forks re-theming) only means adding a second set of variables. The page must work on a phone and be readable without hovering.
- **Detail view (step 5):** clicking a tile opens the long-run chart, a sentence on what the indicator means, and its caveats.
- **Real-time tiles:** the footer shows "Real-time · HH:MM" and the date the value was fetched.
- **Failures:** a tile whose real data fails keeps its mock value and MOCK badge. A failed real-time fetch falls back to the stored value without any error on screen. That keeps the demo honest and stops one failure from breaking the page.

## Reliability and testing

- Use per-indicator range checks from config. A value outside its range counts as an error, not as new data.
- Write `pytest` tests for the adapters, the schemas and the runner. Base them on small fixture files recorded from real responses, never invented ones.
- If your own sandbox can't reach a source, don't fake the result. Push the code and verify it with a `workflow_dispatch` run, since GitHub runners have open internet. Tell us if you need network access widened in your environment.

## Before going public (checklist)

The site is reachable by anyone from its first deployment. "Going public" here means making the **repo** public and sharing the link beyond the two of us. Work through this list in that step and report anything that's open. Point 2 affects step 2 already. We're not lawyers; flag anything that looks uncertain rather than deciding it.

1. **No secrets anywhere in git history**, not just in the current files. Scan the full history (e.g. with `gitleaks`) and report what you find. Don't rewrite history yourself.
2. **No third-party requests on load.** In the browser's network tab, opening the page must show requests only to our own site until real-time is switched on.
3. **Personal details:**
   - Commit author emails become public, so tell us if commits use a personal address. Changing to GitHub's noreply address is our job.
   - Remove the FigJam board link and personal names from CLAUDE.md and other docs, unless we confirm they can be public.
4. **Impressum and privacy statement (Datenschutzerklärung):**
   - Add `site/impressum.html` and `site/datenschutz.html`, linked in the footer, with clearly marked placeholders for our name and contact address. Don't invent these details.
   - The privacy statement covers: hosting on GitHub Pages (GitHub sees visitor IPs), the opt-in real-time fetches and which services they contact, no cookies or tracking, and `localStorage` only for the real-time setting.
   - The legal wording is ours to check.
5. **Visible attribution and licences:** every tile shows its source.
   - Copernicus data requires clear and visible attribution to the Copernicus programme (Copernicus Climate Change Service), so put it on the tile, not in a hidden footer.
   - List all sources with their licences in the detail view and on an "About the data" section.
6. **Data source terms:**
   - Confirm that the "Data sources and licences" table in `DECISIONS.md` is complete and current for every source (see the "Licence-cleared sources only" principle), including CoinGecko, Frankfurter/ECB and the IMF.
   - MSCI data isn't used (no licence). Never use MSCI names, data or logos.
7. **Disclaimer** in the footer: the data is shown without guarantee, can be delayed or wrong, and isn't financial advice.
8. **Code licence:** add `LICENSE` (MIT unless we decide otherwise).

## Ready for the community

- `README.md` explains what it is, shows a screenshot, and gives a **"Make your own" guide**:
  - fork the repo;
  - enable Actions (scheduled workflows are off by default in forks);
  - set the Pages source to "GitHub Actions";
  - edit `config/`;
  - run the workflow once.
- Note that GitHub Pages on a private repo needs a paid plan.
- `docs/SPEC.md` documents the config and data formats. `CONTRIBUTING.md` explains how to add a source adapter.
- The code licence is an open question for us. Propose one when we get to publishing (MIT is the default suggestion). Data keeps each source's licence, recorded per indicator and shown on the site.

## Repo layout (target)

```
openspec/                 # OpenSpec specs and changes
config/                   # dashboard.yaml, indicators.yaml
schema/                   # JSON Schemas for config and data files
pipeline/                 # run.py, checks
pipeline/adapters/        # one module per source type
site/                     # index.html, app.js, styles.css
tests/                    # tests and recorded fixtures
docs/SPEC.md
.github/workflows/build-and-deploy.yml
DECISIONS.md              # source choices, fallbacks used, open questions
README.md  CONTRIBUTING.md  LICENSE
```

## Working rules

Make small commits. Use one branch and one PR per step unless we say otherwise. `main` must always be deployable, because every merge goes live. Run the page locally (e.g. `python -m http.server` in `site/`) and check it before merging. When a choice is genuinely ours to make, take the sensible default and log it under "Open questions" in `DECISIONS.md`. Don't change repo visibility or settings yourself; tell us what to change.
