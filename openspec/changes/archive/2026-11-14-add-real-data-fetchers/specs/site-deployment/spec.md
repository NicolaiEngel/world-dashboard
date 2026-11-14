# Spec Delta

## ADDED Requirements

### Requirement: Deploy fetches real data
Before publishing, the deploy workflow SHALL run the data runner, with no secrets, so the published site carries freshly fetched data. A failure of any individual source SHALL NOT fail the deploy. The run summary SHALL appear in the workflow's job summary.

#### Scenario: One source down during deploy
- **WHEN** a push to `main` is deployed while one source is unreachable
- **THEN** the deploy succeeds, that tile stays mocked, and the job summary names the failed indicator

## MODIFIED Requirements

### Requirement: Published site contains page and data
The published site SHALL contain:
- the files from `site/` at its root;
- the mock data at `data/mock-data.json`;
- the data fetched during that deploy at `data/dashboard.json`.

The page SHALL work unchanged under the repository sub-path (`/world-dashboard/`).

#### Scenario: Data served with the site
- **WHEN** `<live URL>/data/mock-data.json` is requested
- **THEN** it returns the same JSON as the committed mock data file

#### Scenario: Fetched data served
- **WHEN** `<live URL>/data/dashboard.json` is requested after a deploy
- **THEN** it returns the runner's output from that deploy

#### Scenario: Works under a sub-path
- **WHEN** the page is opened at `https://<owner>.github.io/world-dashboard/`
- **THEN** all 13 tiles render and every asset loads with status 200
