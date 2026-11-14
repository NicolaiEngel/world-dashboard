# Spec Delta

## MODIFIED Requirements

### Requirement: Mock data covers the 13 MVP indicators
The mock data SHALL contain exactly these indicators: `temp_anomaly`, `co2_ppm`, `child_mortality`, `life_expectancy`, `drinking_water`, `conflict_deaths`, `gdp_growth_advanced`, `gdp_growth_developing`, `eur_usd`, `usd_cny`, `btc_usd`, `population` and `fertility`. Every indicator SHALL have `mock: true`.

#### Scenario: Indicator count
- **WHEN** the data file is loaded
- **THEN** it lists 13 indicators, each with `mock` set to `true`

#### Scenario: MSCI replaced by GDP growth
- **WHEN** the Economy indicators are listed
- **THEN** they are `gdp_growth_advanced`, `gdp_growth_developing`, `eur_usd`, `usd_cny` and `btc_usd`. The two GDP entries are annual, with unit "%", and neither `msci_world` nor `msci_em` exists
