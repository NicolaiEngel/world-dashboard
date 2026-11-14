# data-fetching Specification

## Purpose

Fetches real values for each dashboard indicator from public sources and assembles them into the data file the page reads. Any indicator that can't be fetched reliably falls back to its labelled mock data.

## Requirements

### Requirement: Runner writes the dashboard data file
A runner SHALL produce `data/dashboard.json` in the same format as `data/mock-data.json`: the same top-level fields, the same `categories`, and one entry per indicator in the mock file, in the same order. Fetched indicators SHALL have `mock: false`. The runner SHALL run with no API keys and no paid services.

#### Scenario: Complete output
- **WHEN** the runner finishes, whatever the outcome of individual fetches
- **THEN** `data/dashboard.json` exists, has the same indicator ids and order as the mock file, and every entry has the fields that the mock-data spec requires

### Requirement: Only licence-cleared sources are fetched
An indicator SHALL be fetched only from a source whose published terms were read and found to allow display on a public, non-commercial website. `DECISIONS.md` SHALL record, for each such source: the terms URL, the decisive quote, the licence, and the required attribution. An indicator whose source isn't cleared SHALL have no active fetcher and SHALL stay mock.

#### Scenario: Source not cleared
- **WHEN** a source's terms forbid redistribution or can't be confirmed (as for MSCI index levels, which is why they were dropped)
- **THEN** the runner doesn't contact that source, the tile stays `mock: true`, and the run summary says "mock (licence not cleared)"

#### Scenario: Licence record exists
- **WHEN** an indicator is marked as fetchable in the indicator table
- **THEN** `DECISIONS.md` lists its source with the terms URL, the quote, the licence and the attribution

### Requirement: Required attribution is visible on the tile
For each fetched indicator, `source.name` SHALL contain the attribution its licence requires, for example "Copernicus Climate Change Service (C3S)", "ECB via Frankfurter" or "World Bank". `source.url` SHALL point to the source. The tile shows both through its existing source link.

#### Scenario: Copernicus attribution
- **WHEN** `temp_anomaly` is real
- **THEN** its tile footer names the Copernicus Climate Change Service and links to the source

### Requirement: Wording comes from the mock entry
For each fetched indicator, the runner SHALL keep `id`, `title`, `subtitle`, `category`, `cadence`, `unit`, `decimals` and `caveat` from the mock entry, unless the source requires a change that is recorded in `DECISIONS.md`. It SHALL replace `series`, `as_of`, `source` and `mock` with the fetched values.

#### Scenario: Real entry
- **WHEN** `life_expectancy` is fetched successfully
- **THEN** its entry keeps the mock title and subtitle, has `mock: false`, a series of World Bank values for `WLD`, `as_of` equal to the last series date, and a World Bank source URL

### Requirement: Values are fetched, never typed in
Every value in a `mock: false` entry SHALL come from an automated fetch of the named public source in that run. Unit conversions SHALL be exact (for example people → billions). No value SHALL be estimated, interpolated or entered by hand.

#### Scenario: Unit scaling
- **WHEN** world population is fetched in people
- **THEN** the series is stored in billions, divided by 10⁹ exactly, with the indicator's decimals applied

### Requirement: Per-indicator fallback to mock
If an indicator's fetch fails, times out, returns an empty series, or has a latest value outside its plausible range, the runner SHALL use, in order: (1) that indicator's previously published entry, if it has `mock: false` and passes the same range check; (2) otherwise its unchanged mock entry (`mock: true`). It SHALL log the reason and fallback, continue with the other indicators, and exit successfully unless it can't write the output file.

#### Scenario: Source down
- **WHEN** the NOAA endpoint returns an error and no previously published real entry exists for `co2_ppm`
- **THEN** `co2_ppm` keeps its mock entry with `mock: true`, the log names the indicator and the error, and all other indicators are processed

#### Scenario: Source down after earlier success
- **WHEN** the NOAA endpoint returns an error and yesterday's published `co2_ppm` was real
- **THEN** `co2_ppm` keeps yesterday's real entry unchanged (same series and `as_of`, `mock: false`)

#### Scenario: Implausible value
- **WHEN** a fetched latest value lies outside the indicator's configured min–max range
- **THEN** the indicator uses the last-good or mock fallback, and the log reports a range-check failure

### Requirement: Series windows and dates
Daily indicators SHALL store about the last 2 years of daily points with `YYYY-MM-DD` dates. Annual indicators SHALL store their full available history with `YYYY` dates. Series SHALL be sorted oldest first, with no null values.

#### Scenario: Gaps are skipped
- **WHEN** a source reports a missing or flagged daily value (for example a NOAA `-999.99`)
- **THEN** that day is omitted from the series, not filled in

### Requirement: Run summary
The runner SHALL print a summary: one line per indicator saying whether it was fetched, kept last-good data (with that data's `as_of`), or fell back to mock, with the reason for any fallback.

#### Scenario: Summary output
- **WHEN** the runner finishes
- **THEN** its output lists all 13 indicators, each as "real", "last-good (<as_of>, <reason>)" or "mock (<reason>)"

### Requirement: Tested against recorded responses
Each source module SHALL have tests that parse small fixture files recorded from real responses of that source. The tests SHALL cover a successful parse, a malformed or empty response, and range-check failure. Fixtures SHALL NOT be invented.

#### Scenario: Offline test run
- **WHEN** `pytest` runs without network access
- **THEN** all fetcher and runner tests pass using the recorded fixtures

### Requirement: Previously published data is the last-good source
When given the URL of the published site, the runner SHALL download the published `data/dashboard.json` before fetching. If that download fails, the runner SHALL continue without last-good data.

#### Scenario: First deploy ever
- **WHEN** there is no published `data/dashboard.json` yet (404)
- **THEN** the runner continues, and failed indicators fall back to mock
