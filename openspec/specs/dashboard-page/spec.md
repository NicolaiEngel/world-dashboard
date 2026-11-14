# dashboard-page Specification

## Purpose

The single web page that shows the state of the world at a glance. It renders every indicator in the data file as an identical tile, grouped by category.

## Requirements

### Requirement: Page is built from the data file
The page SHALL build its category groups and tiles entirely from the data file it loaded. It SHALL contain no indicator-specific markup or code, except the list of real-time-eligible indicator ids in the real-time module. An indicator added to the data file SHALL appear without code changes.

#### Scenario: All indicators render
- **WHEN** the page loads a data file with 13 indicators
- **THEN** exactly 13 tiles are rendered, one per indicator

#### Scenario: New indicator needs no code
- **WHEN** an extra indicator with a valid shape and an existing category is added to the data file
- **THEN** the page renders a 14th tile with no code change

### Requirement: Header
The page SHALL show a header with the title "World Dashboard" and three placeholder icons (🌐 ✏️ 👤) that do nothing. The header SHALL NOT show a data date, because each tile shows its own date.

#### Scenario: Header contents
- **WHEN** the page has loaded
- **THEN** the header shows "World Dashboard" and three inert icons, and no "Data as of" text

### Requirement: Category groups
Tiles SHALL be grouped under category headings, in the order of the data file's `categories` list. Within a category, tiles SHALL follow the order of the data file. A category with no indicators SHALL NOT be shown.

#### Scenario: Category order
- **WHEN** the page renders
- **THEN** the headings appear as Economy, Climate, Health, Living standards, Stability, Demography, and Climate holds the temperature tile followed by the CO₂ tile

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

### Requirement: Neutral, theme-ready styling
The page SHALL use light mode only. Every colour SHALL come from CSS custom properties, so a second theme only needs a second set of variables. Every mini chart SHALL use the same blue. Nothing on the page SHALL colour a value as good or bad.

#### Scenario: Same chart colour
- **WHEN** the mini charts of any two tiles are compared
- **THEN** they use the same line colour

### Requirement: Works on a phone
The page SHALL be readable at a 360 px viewport width without horizontal scrolling and without hovering. The tile grid SHALL wrap instead of shrinking tiles below their readable size.

#### Scenario: Narrow screen
- **WHEN** the page is opened at 360 px width
- **THEN** there is no horizontal scroll and every tile's full content is visible

### Requirement: Only its own origin on load
When the page loads, the browser SHALL make requests only to the page's own origin, unless the visitor has switched real-time prices on. The chart library and any fonts SHALL be served from the site itself. The page SHALL set no cookies and SHALL include no analytics or third-party embeds. Its only use of `localStorage` SHALL be the real-time setting.

#### Scenario: Network on load
- **WHEN** the page is loaded with real-time off and the network log open
- **THEN** every request goes to the page's own origin and no cookies are set

### Requirement: Load failure is visible, not broken
If the data file cannot be loaded or parsed, the page SHALL keep its header and show a short message saying the data could not be loaded. It SHALL NOT throw uncaught errors.

#### Scenario: Missing data file
- **WHEN** the data file returns 404
- **THEN** the page shows its header and a "data could not be loaded" message, and the console has no uncaught errors

### Requirement: Clean console
With valid data, loading the page SHALL produce no errors in the browser console.

#### Scenario: No console errors
- **WHEN** the page loads the mock data
- **THEN** the console shows no errors

### Requirement: Fetched data first, mock as fallback
The page SHALL load `data/dashboard.json`. If that file is missing or can't be parsed, it SHALL load `data/mock-data.json` instead. Only if both fail SHALL it show the "data could not be loaded" message.

#### Scenario: Fetched file present
- **WHEN** both files exist
- **THEN** the tiles show the values from `data/dashboard.json`

#### Scenario: Local preview without fetching
- **WHEN** `data/dashboard.json` returns 404
- **THEN** the page renders all tiles from `data/mock-data.json`, and the console has no uncaught errors
