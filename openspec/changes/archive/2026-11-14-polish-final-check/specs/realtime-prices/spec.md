# Spec Delta

## MODIFIED Requirements

### Requirement: Off by default, opt-in control
The page SHALL contact no outside source until the visitor switches real-time on. A header control SHALL name the service it connects to (Frankfurter), at every screen width. On narrow screens a shorter label (for example "Real-time rates (Frankfurter)") MAY be used. The same control SHALL switch real-time off again.

#### Scenario: First visit
- **WHEN** a visitor opens the page for the first time on a desktop screen
- **THEN** only the page's own origin is contacted, and the header shows "Load real-time exchange rates (connects to Frankfurter)"

#### Scenario: Narrow screen
- **WHEN** the page is shown at 360 px width
- **THEN** the control's visible label still contains "Frankfurter", and its accessible name is the full label

#### Scenario: Switch off
- **WHEN** real-time is on and the visitor switches it off
- **THEN** no further outside requests are made, and the affected tiles show their stored values again
