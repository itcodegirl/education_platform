# Repository Canonicalization Checklist (CodeHerWay)

This checklist covers portfolio-facing updates that require GitHub/profile settings outside the codebase.

## 1) Canonical repository naming and positioning

- Keep `itcodegirl/education_platform` as the active canonical CodeHerWay app repository, or rename it to a clearer canonical name (for example `codeherway-platform`) when convenient.
- Ensure the active repository description explicitly says this is the live CodeHerWay portfolio app.
- Mark older/archived repositories as archival references only.

## 2) Portfolio and external link alignment

- Update portfolio project cards so every "CodeHerWay" source link points to this active repository.
- Update any resume/case-study links that still reference archived repos.
- Verify live demo CTA buttons, case study pages, and README links all resolve to the same active repository.

## 3) GitHub profile pinning

- Pin this active CodeHerWay repository in the top row of GitHub pinned repositories.
- Move archived predecessors lower (or unpin) so reviewers encounter the active app first.

## 4) Archived repository redirect copy

- Add a clear banner at the top of archived repository READMEs:
  - "This repository is archived and not the active CodeHerWay product."
  - "Active canonical app: https://github.com/itcodegirl/education_platform".
- Lock stale roadmap/issues in archived repos where appropriate to reduce confusion.

## 5) Final consistency pass

- Confirm the active repo README, live demo, portfolio case study, and GitHub profile all refer to the same canonical source.
- Re-run this checklist whenever repo names, portfolio URLs, or deploy targets change.
