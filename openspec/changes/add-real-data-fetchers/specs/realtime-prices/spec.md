# Spec Delta

## Purpose

Lets a visitor opt in to up-to-date exchange rates fetched directly in their own browser. Without that explicit choice, no third party is ever contacted.

## ADDED Requirements

### Requirement: Off by default, opt-in control
The page SHALL contact no outside source until the visitor switches real-time on. A header control SHALL name the service it connects to (Frankfurter). The same control SHALL switch real-time off again.

#### Scenario: First visit
- **WHEN** a visitor opens the page for the first time
- **THEN** only the page's own origin is contacted, and the header shows "Load real-time exchange rates (connects to Frankfurter)"

#### Scenario: Switch off
- **WHEN** real-time is on and the visitor switches it off
- **THEN** no further outside requests are made, and the affected tiles show their stored values again

### Requirement: Choice is remembered on this device
The choice SHALL be stored in `localStorage` and applied on the next visit from the same browser. If storage is unavailable, real-time SHALL simply start off.

#### Scenario: Returning visitor
- **WHEN** a visitor who switched real-time on reloads the page
- **THEN** real-time values load without another click

### Requirement: Eligible tiles only
Real-time SHALL apply only to `eur_usd` and `usd_cny`, and only when that tile's stored data is real (`mock: false`). It SHALL replace the big value only. The mini chart and its series stay stored data.

#### Scenario: Stored data still mocked
- **WHEN** `eur_usd` is still mock in the data file and real-time is on
- **THEN** the EUR/USD tile keeps its mock value and MOCK badge, and no real-time value is shown

#### Scenario: Bitcoin is not real-time
- **WHEN** real-time is on
- **THEN** the Bitcoin tile shows its stored daily value and no request about Bitcoin leaves the browser

### Requirement: Real-time label
A tile showing a real-time value SHALL say "Real-time · HH:MM" in its footer, using the visitor's local time of the fetch, in place of the stored date.

#### Scenario: Label after fetch
- **WHEN** real-time rates are fetched at 14:32 local time
- **THEN** the EUR/USD and USD/CNY tile footers read "Real-time · 14:32"

### Requirement: Polite fetching
When real-time is switched on, and on each page load while it is on, the page SHALL make exactly one Frankfurter request (ECB provider) that returns both USD and CNY against EUR. It SHALL make no periodic refresh, since ECB rates change once per working day.

#### Scenario: One FX call
- **WHEN** real-time loads
- **THEN** exactly one request goes to Frankfurter, and no further request follows while the page stays open

### Requirement: Silent failure
If the real-time request fails or takes longer than about 5 seconds, the tiles SHALL keep their stored values and labels. The page SHALL show no error message and SHALL log no uncaught error.

#### Scenario: Frankfurter unreachable
- **WHEN** the Frankfurter request times out
- **THEN** the FX tiles still show their stored values and dates, and the console has no uncaught errors
