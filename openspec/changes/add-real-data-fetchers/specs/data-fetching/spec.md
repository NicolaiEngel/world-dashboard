# Spec Delta

## Purpose

Fetches real values for each dashboard indicator from public sources and assembles them into the data file the page reads. Any indicator that can't be fetched reliably falls back to its labelled mock data.

## ADDED Requirements

### Requirement: Runner writes the dashboard data file
A runner SHALL produce `data/dashboard.json` in the same format as `data/mock-data.json`: the same top-level fields, the same `categories`, and one entry per indicator in the mock file, in the same order. Fetched indicators SHALL have `mock: false`. The runner SHALL run with no API keys and no paid services.

#### Scenario: Complete output
- **WHEN** the runner finishes, whatever the outcome of individual fetches
- **THEN** `data/dashboard.json` exists, has the same indicator ids and order as the mock file, and every entry has the fields that the mock-data spec requires

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
If an indicator's fetch fails, times out, returns an empty series, or has a latest value outside that indicator's plausible range, the runner SHALL keep that indicator's mock entry unchanged (`mock: true`). It SHALL log the reason and continue with the other indicators. The runner SHALL exit successfully unless it can't write the output file.

#### Scenario: Source down
- **WHEN** the NOAA endpoint returns an error
- **THEN** `co2_ppm` keeps its mock entry with `mock: true`, the log names the indicator and the error, and all other indicators are processed

#### Scenario: Implausible value
- **WHEN** a fetched latest value lies outside the indicator's configured min–max range
- **THEN** the indicator keeps its mock entry, and the log reports a range-check failure

### Requirement: Series windows and dates
Daily indicators SHALL store about the last 2 years of daily points with `YYYY-MM-DD` dates. Annual indicators SHALL store their full available history with `YYYY` dates. Series SHALL be sorted oldest first, with no null values.

#### Scenario: Gaps are skipped
- **WHEN** a source reports a missing or flagged daily value (for example a NOAA `-999.99`)
- **THEN** that day is omitted from the series, not filled in

### Requirement: Run summary
The runner SHALL print a summary: one line per indicator saying whether it was fetched or fell back to mock, with the reason for any fallback.

#### Scenario: Summary output
- **WHEN** the runner finishes
- **THEN** its output lists all 13 indicators, each as "real" or "mock (<reason>)"

### Requirement: Tested against recorded responses
Each source module SHALL have tests that parse small fixture files recorded from real responses of that source. The tests SHALL cover a successful parse, a malformed or empty response, and range-check failure. Fixtures SHALL NOT be invented.

#### Scenario: Offline test run
- **WHEN** `pytest` runs without network access
- **THEN** all fetcher and runner tests pass using the recorded fixtures
