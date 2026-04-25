# Contributing to CodeHerWay

Thanks for wanting to help. CodeHerWay is a learning platform for women in tech, and contributions are welcome, especially new lessons, accessibility fixes, and security improvements.

## Ground rules

- Be kind. This project exists for people who are learning.
- Security issues first. If you found a vulnerability, do not open a public issue. See [SECURITY.md](./SECURITY.md) for coordinated disclosure.
- One idea per PR. Large unrelated drive-by changes are hard to review and rarely merge.

## Local setup

```bash
git clone https://github.com/itcodegirl/education_platform.git
cd education_platform
npm ci
cp .env.example .env
npm run dev
```

Preview the design tokens at `http://localhost:5173/styleguide`.

## Before you open a PR

Run these locally (same baseline checks used in CI):

```bash
npm run check
npm run check:ci
npm audit --audit-level=high
```

## PR checklist

- [ ] Branch is up to date with `main`
- [ ] Fast checks pass (`npm run check`)
- [ ] Integration/E2E checks pass (`npm run check:ci`)
- [ ] No secrets committed (check `git diff` carefully)
- [ ] No new high-severity `npm audit` findings
- [ ] Commit messages follow the existing style (`feat:`, `fix:`, `security:`, `docs:`, `refactor:`)
- [ ] For UI changes, attach screenshots or a short Loom in the PR description

## Adding a new lesson

Course content lives in `src/data/<course>/modules/*.js` (or `.json`).
Follow the existing lesson shape: legacy markdown, rich format (`concepts` + `tasks`), or structured format (`hook` / `do` / `understand` / `build` / `challenge` / `summary`).

Quizzes live in `src/data/<course>/quizzes.js`, challenges in `src/data/<course>/challenges.js`.

## Styling

- All colors, spacing, typography, and motion values come from [src/styles/tokens.css](./src/styles/tokens.css). Do not hard-code hex colors or magic pixel values in components.
- Preview the token system at `/styleguide`.
- Global responsive breakpoints live in [src/styles/responsive.css](./src/styles/responsive.css).

## Code style

- React function components and hooks only (no classes).
- Destructure props and prefer named exports.
- Do not reach into `localStorage` directly; use [src/hooks/useLocalStorage.js](./src/hooks/useLocalStorage.js).
- Do not use `dangerouslySetInnerHTML` with unescaped input.

## Questions

Open a GitHub Discussion or reach out to [@itcodegirl](https://github.com/itcodegirl).

