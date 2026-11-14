# Spec Delta

## ADDED Requirements

### Requirement: Each tile has an expand button
Every tile SHALL have a keyboard-focusable button on its mini chart that opens the large chart view. The button's accessible name SHALL be "Enlarge chart: <title>". It SHALL NOT change the tile's size or layout. All tiles SHALL still be identical in size.

#### Scenario: Button present
- **WHEN** the page renders 13 tiles
- **THEN** there are 13 expand buttons, one per tile, each named "Enlarge chart: <title>"

#### Scenario: Visible focus
- **WHEN** an expand button receives keyboard focus
- **THEN** it shows a visible focus outline
