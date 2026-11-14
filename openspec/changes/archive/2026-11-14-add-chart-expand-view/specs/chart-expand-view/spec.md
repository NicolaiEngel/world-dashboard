# Spec Delta

## Purpose

Lets a visitor enlarge any tile's chart to read its shape and exact values, using only the data already on the page.

## ADDED Requirements

### Requirement: Open and close the large view
Activating a tile's expand button (click, tap, Enter or Space) SHALL open a modal showing the large chart for that indicator. Esc, a visible close button, or a click on the backdrop SHALL close it, and focus SHALL return to the expand button.

#### Scenario: Open and close by keyboard
- **WHEN** the visitor focuses the CO₂ tile's expand button, presses Enter, then presses Esc
- **THEN** the large view opens with the CO₂ chart, then closes, and the focus is back on that button

#### Scenario: Backdrop click
- **WHEN** the large view is open and the visitor clicks outside the chart panel
- **THEN** the large view closes

### Requirement: Large chart shows the full stored series
The large chart SHALL plot the indicator's full `series`, not the tile's one-year window, with labelled value and date axes. It SHALL use the same line colour as the tiles.

#### Scenario: Daily indicator
- **WHEN** the temperature large view opens and the series holds about 2 years
- **THEN** the chart spans about 2 years, while the tile still shows about the last 12 months

#### Scenario: Annual indicator
- **WHEN** the life expectancy large view opens
- **THEN** the chart spans the first to the last year of its series

### Requirement: Values on hover or tap
Hovering or tapping the large chart SHALL show the nearest point's date and its value, formatted with the indicator's `decimals` and `unit`.

#### Scenario: Read a value
- **WHEN** the visitor hovers over the last point of the population chart
- **THEN** a label shows that point's year and its value, for example "8.22 bn"

### Requirement: Only existing content
Besides the chart, the large view SHALL show only content the tile already shows: the title, the MOCK badge if mocked, the unit, and the source link. It SHALL add no other text and SHALL make no request outside the page's own origin.

#### Scenario: Mock tile
- **WHEN** the Bitcoin large view opens while `btc_usd` is mocked
- **THEN** it shows the MOCK badge next to the title

#### Scenario: No outside requests
- **WHEN** any large view is opened
- **THEN** no request leaves the page's own origin

### Requirement: Works on a phone
At 360 px width the large view SHALL fill the screen without horizontal scrolling, with the close button and source link visible.

#### Scenario: Phone
- **WHEN** a large view is opened at 360 px width
- **THEN** it fills the screen, the chart is readable, and the close button is reachable
