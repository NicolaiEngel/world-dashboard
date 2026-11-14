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
The published site SHALL contain the files from `site/` at its root and the data file at `data/mock-data.json`. The page SHALL work unchanged under the repository sub-path (`/world-dashboard/`).

#### Scenario: Data served with the site
- **WHEN** `<live URL>/data/mock-data.json` is requested
- **THEN** it returns the same JSON as the committed data file

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
