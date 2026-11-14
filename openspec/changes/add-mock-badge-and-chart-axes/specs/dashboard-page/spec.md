# Spec Delta

## ADDED Requirements

### Requirement: Mocked tiles are labelled
A tile SHALL show a "MOCK" badge next to its title if and only if its indicator has `mock: true`. The badge SHALL use the same neutral style on every tile. It SHALL carry an accessible explanation that the values are illustrative and not real data.

#### Scenario: All tiles mocked
- **WHEN** the page loads the mock data, where all 13 indicators have `mock: true`
- **THEN** all 13 tiles show a "MOCK" badge

#### Scenario: Real tile has no badge
- **WHEN** an indicator in the data file has `mock: false`
- **THEN** its tile shows no "MOCK" badge, and every tile with `mock: true` still shows one

#### Scenario: Badge explained
- **WHEN** a screen reader reads a mocked tile's title, or a visitor hovers or focuses the badge
- **THEN** it says the values are illustrative mock data, not real values

## MODIFIED Requirements

### Requirement: Identical tile format
Every tile SHALL have the same size and the same structure, in this order:
1. the title, followed by a "MOCK" badge while the indicator is mocked;
2. the one-line definition (`subtitle`);
3. the big value, formatted with the indicator's `decimals` and `unit`;
4. a mini chart of its series;
5. a footer with the update frequency, the `as_of` date and a link to the source.

Text SHALL fit inside the tile without overflowing.

#### Scenario: Tile contents
- **WHEN** any tile is inspected
- **THEN** it shows the title (with the MOCK badge if mocked), the definition, the latest value with the right decimals and unit, a mini chart, and a footer with the frequency ("Daily" or "Annual"), the date and a source link

#### Scenario: Uniform size
- **WHEN** the tiles are measured at any one viewport width
- **THEN** all tiles have the same width and height

#### Scenario: Source link
- **WHEN** the visitor follows a tile's source link
- **THEN** it goes to the indicator's `source.url` and opens in a new tab

### Requirement: Mini chart covers a recent window
A daily tile's mini chart SHALL show about the last year of its series. An annual tile's mini chart SHALL show its full series. Each mini chart SHALL have a value axis and a date axis, each with labelled tick marks, readable without hovering. It SHALL have no interactive tooltips.

#### Scenario: Daily window
- **WHEN** the temperature tile renders with about 2 years of data
- **THEN** its mini chart shows about the last 12 months

#### Scenario: Value axis
- **WHEN** any mini chart renders
- **THEN** its value axis shows at least two labelled ticks that span the plotted values, formatted compactly (for example "1.2", "425", "90k")

#### Scenario: Date axis
- **WHEN** an annual tile's chart renders
- **THEN** its date axis shows at least two year labels, including one near the first and one near the last year of the series

#### Scenario: Daily date labels
- **WHEN** a daily tile's chart renders
- **THEN** its date axis shows at least two month labels with their year (for example "Dec 2025", "Nov 2026")

#### Scenario: Axes on a phone
- **WHEN** the page is shown at 360 px width
- **THEN** the axis labels are visible and don't overlap each other or spill outside the tile
