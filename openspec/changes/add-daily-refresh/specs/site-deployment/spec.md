# Spec Delta

## ADDED Requirements

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
