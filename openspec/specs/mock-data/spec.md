# mock-data Specification

## Purpose

Provides the clearly labelled mock dataset that the dashboard renders until real fetchers replace each indicator. It also defines the data shape that real fetchers must later emit.

## Requirements

### Requirement: Mock data is generated reproducibly
`data/mock-data.json` SHALL be produced by `scripts/make_mock_data.py` and SHALL NOT be edited by hand. Running the generator twice SHALL produce byte-identical output.

#### Scenario: Regenerating gives the committed file
- **WHEN** `python scripts/make_mock_data.py` is run on a clean checkout
- **THEN** the resulting `data/mock-data.json` is identical to the committed file

### Requirement: Mock data covers the 13 MVP indicators
The mock data SHALL contain exactly these indicators: `temp_anomaly`, `co2_ppm`, `child_mortality`, `life_expectancy`, `drinking_water`, `conflict_deaths`, `msci_world`, `msci_em`, `eur_usd`, `usd_cny`, `btc_usd`, `population` and `fertility`. Every indicator SHALL have `mock: true`.

#### Scenario: Indicator count
- **WHEN** the data file is loaded
- **THEN** it lists 13 indicators, each with `mock` set to `true`

### Requirement: Each indicator has the agreed fields
Each indicator SHALL have `id`, `title`, `subtitle`, `category`, `cadence` (`daily` or `annual`), `unit`, `decimals`, `source` (with `name` and `url`), `as_of`, `mock`, an optional `caveat`, and `series`. The `series` field is a list of `{date, value}` pairs, oldest first. `as_of` SHALL equal the date of the last series point. Every `category` SHALL appear in the top-level `categories` list. The top-level fields stay as they are.

#### Scenario: Fields present and consistent
- **WHEN** any indicator is inspected
- **THEN** all required fields are present, its `category` is in `categories`, and `as_of` matches the last `series` date

### Requirement: Temperature anomaly is daily
`temp_anomaly` SHALL have `cadence: "daily"` and about 2 years of consecutive daily values (`YYYY-MM-DD`), expressed as °C above the 1850–1900 average. It SHALL keep its caveat that the Paris goal refers to long-term averages.

#### Scenario: Daily temperature series
- **WHEN** `temp_anomaly` is inspected
- **THEN** its cadence is `daily`, its series spans about 730 calendar days with ISO day dates, and its caveat mentions long-term averages

### Requirement: CO₂ concentration indicator exists
The mock data SHALL include `co2_ppm` in category Climate. It SHALL be daily, have unit "ppm", and have about 2 years of values showing a seasonal cycle on a rising trend. Its source SHALL be NOAA GML Mauna Loa.

#### Scenario: CO₂ tile data
- **WHEN** `co2_ppm` is inspected
- **THEN** it is in Climate, its cadence is `daily`, its unit is `ppm`, its source name refers to NOAA GML Mauna Loa, and its series spans about 2 years

#### Scenario: Climate order
- **WHEN** the indicators are read in file order
- **THEN** `co2_ppm` directly follows `temp_anomaly`
