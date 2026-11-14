# site-deployment Specification

## Purpose

Keeps a working prototype online at all times. Every push to `main` publishes the static page and its data to GitHub Pages, so each merged step is live.

## Requirements

### Requirement: Publish on push to main
A GitHub Actions workflow SHALL publish the site to GitHub Pages on every push to `main`. It SHALL also run when started by hand (`workflow_dispatch`). It SHALL use only the official Pages actions and SHALL need no secrets beyond the built-in token.

#### Scenario: Merge goes live
- **WHEN** a commit is pushed to `main`
- **THEN** the workflow runs and the live URL serves the page from that commit

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

### Requirement: The local preview matches the published layout
Running a plain static server in `site/` SHALL give the same page as the published site, data included, with no extra build step.

#### Scenario: Local preview
- **WHEN** `python -m http.server` is run in `site/` and `http://localhost:8000/` is opened
- **THEN** the page renders all 13 tiles from the mock data

### Requirement: One deployment at a time
Overlapping runs SHALL NOT publish out of order. A newer push SHALL win over an older run that is still in progress.

#### Scenario: Two quick pushes
- **WHEN** two commits are pushed to `main` in quick succession
- **THEN** the site ends up serving the later commit

### Requirement: Deploy fetches real data
Before publishing, the deploy workflow SHALL run the data runner, with no secrets, so the published site carries freshly fetched data. A failure of any individual source SHALL NOT fail the deploy. The run summary SHALL appear in the workflow's job summary.

#### Scenario: One source down during deploy
- **WHEN** a push to `main` is deployed while one source is unreachable
- **THEN** the deploy succeeds, that tile stays mocked, and the job summary names the failed indicator

### Requirement: Daily scheduled refresh
The deploy workflow SHALL also run on a daily schedule at an off-peak minute (05:17 UTC). Each scheduled run SHALL fetch, test and publish exactly as a push-triggered run does.

#### Scenario: Scheduled run
- **WHEN** 05:17 UTC passes on any day
- **THEN** the workflow runs, and the live `data/dashboard.json` has a `generated_at` from that run

### Requirement: Keepalive is opt-in per repository
The workflow SHALL include a step that keeps its schedule from being disabled after 60 days of repository inactivity. It SHALL use the GitHub API with the built-in token, and make no commits. The step SHALL run only when the repository variable `KEEPALIVE` equals `true`.

#### Scenario: Fork without the variable
- **WHEN** the workflow runs in a fork that hasn't set `KEEPALIVE`
- **THEN** the keepalive step is skipped

#### Scenario: Enabled repository
- **WHEN** the workflow runs with `KEEPALIVE=true`
- **THEN** the keepalive step calls the API to keep the workflow enabled, and no commit is created
