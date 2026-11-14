# Spec Delta

## ADDED Requirements

### Requirement: Fetched data first, mock as fallback
The page SHALL load `data/dashboard.json`. If that file is missing or can't be parsed, it SHALL load `data/mock-data.json` instead. Only if both fail SHALL it show the "data could not be loaded" message.

#### Scenario: Fetched file present
- **WHEN** both files exist
- **THEN** the tiles show the values from `data/dashboard.json`

#### Scenario: Local preview without fetching
- **WHEN** `data/dashboard.json` returns 404
- **THEN** the page renders all tiles from `data/mock-data.json`, and the console has no uncaught errors

## MODIFIED Requirements

### Requirement: Page is built from the data file
The page SHALL build its category groups and tiles entirely from the data file it loaded. It SHALL contain no indicator-specific markup or code, except the list of real-time-eligible indicator ids in the real-time module. An indicator added to the data file SHALL appear without code changes.

#### Scenario: All indicators render
- **WHEN** the page loads a data file with 13 indicators
- **THEN** exactly 13 tiles are rendered, one per indicator

#### Scenario: New indicator needs no code
- **WHEN** an extra indicator with a valid shape and an existing category is added to the data file
- **THEN** the page renders a 14th tile with no code change

### Requirement: Only its own origin on load
When the page loads, the browser SHALL make requests only to the page's own origin, unless the visitor has switched real-time prices on. The chart library and any fonts SHALL be served from the site itself. The page SHALL set no cookies and SHALL include no analytics or third-party embeds. Its only use of `localStorage` SHALL be the real-time setting.

#### Scenario: Network on load
- **WHEN** the page is loaded with real-time off and the network log open
- **THEN** every request goes to the page's own origin and no cookies are set
