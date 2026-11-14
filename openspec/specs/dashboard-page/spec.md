# dashboard-page Specification

## Purpose

The single web page that shows the state of the world at a glance. It renders every indicator in the data file as an identical tile, grouped by category.

## Requirements

### Requirement: Page is built from the data file
The page SHALL build its category groups and tiles entirely from the data file. It SHALL contain no indicator-specific markup or code. An indicator added to the data file SHALL appear without code changes.

#### Scenario: All indicators render
- **WHEN** the page loads the mock data with 13 indicators
- **THEN** exactly 13 tiles are rendered, one per indicator

#### Scenario: New indicator needs no code
- **WHEN** an extra indicator with a valid shape and an existing category is added to the data file
- **THEN** the page renders a 14th tile with no code change

### Requirement: Header
The page SHALL show a header with the title "World Dashboard" and the data date. The data date is the most recent `as_of` among the indicators. The header SHALL also show three placeholder icons (🌐 ✏️ 👤) that do nothing.

#### Scenario: Header contents
- **WHEN** the page has loaded
- **THEN** the header shows "World Dashboard", the most recent `as_of` date, and three inert icons

### Requirement: Category groups
Tiles SHALL be grouped under category headings, in the order of the data file's `categories` list. Within a category, tiles SHALL follow the order of the data file. A category with no indicators SHALL NOT be shown.

#### Scenario: Category order
- **WHEN** the page renders
- **THEN** the headings appear as Climate, Health, Living standards, Stability, Economy, Demography, and Climate holds the temperature tile followed by the CO₂ tile

### Requirement: Empty slot for later indicators
The last category group SHALL end with one empty placeholder slot of tile size, styled as a dashed outline. The slot is not an indicator tile and SHALL NOT contain data.

#### Scenario: Placeholder after Demography
- **WHEN** the page renders
- **THEN** the Demography group shows its two tiles followed by one empty dashed slot, and the slot is not counted among the 13 tiles

### Requirement: Identical tile format
Every tile SHALL have the same size and the same structure, in this order:
1. the title;
2. the one-line definition (`subtitle`);
3. the big value, formatted with the indicator's `decimals` and `unit`;
4. a mini chart of its series;
5. a footer with the update frequency, the `as_of` date and a link to the source.

Text SHALL fit inside the tile without overflowing.

#### Scenario: Tile contents
- **WHEN** any tile is inspected
- **THEN** it shows the title, the definition, the latest value with the right decimals and unit, a mini chart, and a footer with the frequency ("Daily" or "Annual"), the date and a source link

#### Scenario: Uniform size
- **WHEN** the tiles are measured at any one viewport width
- **THEN** all tiles have the same width and height

#### Scenario: Source link
- **WHEN** the visitor follows a tile's source link
- **THEN** it goes to the indicator's `source.url` and opens in a new tab

### Requirement: Mini chart covers a recent window
A daily tile's mini chart SHALL show about the last year of its series. An annual tile's mini chart SHALL show its full series. The chart SHALL have no axes or interactive tooltips that are needed to read the tile.

#### Scenario: Daily window
- **WHEN** the temperature tile renders with about 2 years of data
- **THEN** its mini chart shows about the last 12 months

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
When the page loads, the browser SHALL make requests only to the page's own origin. The chart library and any fonts SHALL be served from the site itself. The page SHALL set no cookies and SHALL include no analytics or third-party embeds.

#### Scenario: Network on load
- **WHEN** the page is loaded with the network log open
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
