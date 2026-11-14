# Spec Delta

## ADDED Requirements

### Requirement: Previously published data is the last-good source
When given the URL of the published site, the runner SHALL download the published `data/dashboard.json` before fetching. If that download fails, the runner SHALL continue without last-good data.

#### Scenario: First deploy ever
- **WHEN** there is no published `data/dashboard.json` yet (404)
- **THEN** the runner continues, and failed indicators fall back to mock

## MODIFIED Requirements

### Requirement: Per-indicator fallback to mock
If an indicator's fetch fails, times out, returns an empty series, or has a latest value outside that indicator's plausible range, the runner SHALL fall back in this order:
1. that indicator's entry from the previously published data, if it has `mock: false` and passes the same range check;
2. otherwise, its mock entry unchanged (`mock: true`).

The runner SHALL log the reason and the fallback used, and SHALL continue with the other indicators. The runner SHALL exit successfully unless it can't write the output file.

#### Scenario: Source down
- **WHEN** the NOAA endpoint returns an error and no previously published real entry exists for `co2_ppm`
- **THEN** `co2_ppm` keeps its mock entry with `mock: true`, the log names the indicator and the error, and all other indicators are processed

#### Scenario: Source down after earlier success
- **WHEN** the NOAA endpoint returns an error and yesterday's published `co2_ppm` was real
- **THEN** `co2_ppm` keeps yesterday's real entry unchanged (same series and `as_of`, `mock: false`)

#### Scenario: Implausible value
- **WHEN** a fetched latest value lies outside the indicator's configured min–max range
- **THEN** the indicator uses the last-good or mock fallback, and the log reports a range-check failure

### Requirement: Run summary
The runner SHALL print a summary: one line per indicator saying whether it was fetched, kept last-good data (with that data's `as_of`), or fell back to mock, with the reason for any fallback.

#### Scenario: Summary output
- **WHEN** the runner finishes
- **THEN** its output lists all 13 indicators, each as "real", "last-good (<as_of>, <reason>)" or "mock (<reason>)"
