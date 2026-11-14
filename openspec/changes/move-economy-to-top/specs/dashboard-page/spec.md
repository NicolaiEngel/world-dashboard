# Spec Delta

## MODIFIED Requirements

### Requirement: Category groups
Tiles SHALL be grouped under category headings, in the order of the data file's `categories` list. Within a category, tiles SHALL follow the order of the data file. A category with no indicators SHALL NOT be shown.

#### Scenario: Category order
- **WHEN** the page renders
- **THEN** the headings appear as Economy, Climate, Health, Living standards, Stability, Demography, and Climate holds the temperature tile followed by the CO₂ tile
