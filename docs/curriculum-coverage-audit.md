# Curriculum Coverage Audit

Use this when you need to answer, "Is every lesson covered by the right learning
evidence?" It is broader than the quiz rubric audit: it maps lessons to quizzes,
practice prompts, challenge/project evidence, and lesson/quiz rubric depth.

## Quick Commands

```bash
npm run audit:curriculum-coverage
```

To write review artifacts:

```bash
npm run report:curriculum-coverage
```

The report command writes:

- `reports/generated/curriculum-coverage-report.json`
- `reports/generated/curriculum-coverage-gaps.csv`

The audit is report-only by default. It should guide curriculum batches without
blocking unrelated maintenance PRs.

Current expected baseline after the project-evidence coverage batch:

- 100 fully covered lessons
- 0 curriculum coverage gaps
- 24 modules with mapped challenge/project evidence

## What It Checks

For each active lesson, the report asks whether the lesson has:

- quiz coverage from a lesson or module quiz
- practice coverage from a challenge, build goal, task list, or structured steps
- challenge/project evidence through a challenge mapped to the same module
- enough lesson rubric depth from the content-quality rubric
- enough quiz rubric depth from the quiz-quality rubric

It also rolls the result up by course and module so a reviewer can see:

- fully covered lessons
- total coverage gaps
- quiz, practice, and project-evidence percentages
- modules that have mapped challenge/project evidence
- curated project ideas available per course

## Admin View

Open the admin Content QA tab and review the Curriculum Coverage section.

Use the course table to spot the weakest coverage area. Use the top coverage
gap table to pick the next edits. Export the CSV when you want a spreadsheet
for a content sprint.

## Reading The Gaps

| Gap | Meaning | Typical fix |
| --- | --- | --- |
| Lesson quiz | No quiz is mapped to the lesson or its module | Add a lesson quiz or map an existing module quiz |
| Practice prompt | The lesson has no obvious independent practice | Add a build goal, task list, challenge mission, or structured practice steps |
| Challenge/project evidence | The module has no mapped challenge | Add or map a challenge/project task to the module |
| Lesson rubric depth | The lesson is thin against the instructional quality rubric | Add missing learning target, recall, mistake, practice, or transfer signals |
| Quiz rubric depth | The mapped quiz is thin against the quiz-quality rubric | Add reasoning, misconception, or application items |

## Release Use

Before a release that changes course content, run:

```bash
npm run audit:content
npm run audit:curriculum-coverage
npm run report:curriculum-coverage
```

Capture the summary counts in the release notes. If coverage gaps remain, list
the top course/module risk and confirm whether the release is still acceptable
as a report-only curriculum batch.

## Strict Mode

For a future release gate, the script can fail on a gap budget:

```bash
node scripts/audit-curriculum-coverage.mjs --summary --strict --max-gaps 0
```

Keep strict mode out of the default gate until the team intentionally decides
that remaining coverage gaps should block every PR.
