# Spec Delta

## Purpose

Lets a visitor opt in to minute-fresh Bitcoin and exchange-rate values fetched directly in their own browser. Without that explicit choice, no third party is ever contacted.

## ADDED Requirements

### Requirement: Off by default, opt-in control
The page SHALL contact no outside source until the visitor switches real-time on. A header control SHALL name the services it connects to (Coinbase and Frankfurter). The same control SHALL switch real-time off again.

#### Scenario: First visit
- **WHEN** a visitor opens the page for the first time
- **THEN** only the page's own origin is contacted, and the header shows "Load real-time prices (connects to Coinbase and Frankfurter)"

#### Scenario: Switch off
- **WHEN** real-time is on and the visitor switches it off
- **THEN** no further outside requests are made, and the affected tiles show their stored values again

### Requirement: Choice is remembered on this device
The choice SHALL be stored in `localStorage` and applied on the next visit from the same browser. If storage is unavailable, real-time SHALL simply start off.

#### Scenario: Returning visitor
- **WHEN** a visitor who switched real-time on reloads the page
- **THEN** real-time values load without another click

### Requirement: Eligible tiles only
Real-time SHALL apply only to `btc_usd`, `eur_usd` and `usd_cny`, and only when that tile's stored data is real (`mock: false`). It SHALL replace the big value only. The mini chart and its series stay stored data.

#### Scenario: Stored data still mocked
- **WHEN** `btc_usd` is still mock in the data file and real-time is on
- **THEN** the Bitcoin tile keeps its mock value and MOCK badge, and no real-time value is shown

### Requirement: Real-time label
A tile showing a real-time value SHALL say "Real-time · HH:MM" in its footer, using the visitor's local time of the fetch, in place of the stored date.

#### Scenario: Label after fetch
- **WHEN** a real-time BTC price is fetched at 14:32 local time
- **THEN** the Bitcoin tile footer reads "Real-time · 14:32"

### Requirement: Polite fetching
When real-time is switched on, and on each page load while it is on, the page SHALL fetch:
- one Coinbase spot price for BTC;
- one Frankfurter request that returns both rates.

Only Bitcoin SHALL refresh again: every 60 seconds, and only while the tab is visible.

#### Scenario: Hidden tab
- **WHEN** the tab is hidden for 5 minutes with real-time on
- **THEN** no BTC requests are made during that time, and one is made when the tab becomes visible again

#### Scenario: One FX call
- **WHEN** real-time loads
- **THEN** exactly one request goes to Frankfurter, and it returns both USD and CNY against EUR

### Requirement: Silent failure
If a real-time request fails or takes longer than about 5 seconds, the tile SHALL keep its stored value and label. The page SHALL show no error message and SHALL log no uncaught error.

#### Scenario: Coinbase unreachable
- **WHEN** the Coinbase request times out
- **THEN** the Bitcoin tile still shows its stored value and date, and the console has no uncaught errors
