# Spec Delta

## MODIFIED Requirements

### Requirement: Each tile has an expand button
Every tile SHALL have a keyboard-focusable button in its value row that opens the large chart view. The button SHALL NOT overlap the mini chart's plot area. The button's accessible name SHALL be "Enlarge chart: <title>". It SHALL NOT change the tile's size or layout. All tiles SHALL still be identical in size.

#### Scenario: Button present
- **WHEN** the page renders 13 tiles
- **THEN** there are 13 expand buttons, one per tile, each named "Enlarge chart: <title>"

#### Scenario: Visible focus
- **WHEN** an expand button receives keyboard focus
- **THEN** it shows a visible focus outline

#### Scenario: Data not covered
- **WHEN** any tile is rendered at 1440 px or 360 px width
- **THEN** the expand button's box doesn't intersect the chart's plot area

## ADDED Requirements

### Requirement: Compact header on phones
At 360 px width the header SHALL take at most two rows: the title with the icons, and the real-time control.

#### Scenario: Phone header
- **WHEN** the page is shown at 360 px width
- **THEN** the title and the three icons share the first row, the real-time control fits on one line in the second, and the header is no taller than 100 px

### Requirement: No favicon request
The page SHALL declare its favicon inline, so loading the page causes no request for a favicon file.

#### Scenario: Network log
- **WHEN** the page loads
- **THEN** no request for `favicon.ico` or any other icon file is made
