# Contributing to CodeHerWay

Thanks for wanting to help! CodeHerWay is a learning platform for
women in tech and contributions are very welcome — especially new
lessons, accessibility fixes, and security improvements.

## Ground rules

- **Be kind.** This project exists for people who are learning.
  Reviews should teach, not gatekeep.
- **Security issues first.** If you found a vulnerability, **do not
  open a public issue**. See [`SECURITY.md`](./SECURITY.md) for the
  coordinated disclosure process.
- **One idea per PR.** Big drive-by PRs that touch ten unrelated
  things are hard to review and rarely merge.

## Local setup

```bash
git clone https://github.com/itcodegirl/education_platform.git
cd education_platform
npm ci
cp .env.example .env        # fill in Supabase URL + anon key
npm run dev                 # http://localhost:5173
```

Preview the design tokens at `http://localhost:5173/#styleguide`.

## Before you open a PR

Run these locally — the same checks run in CI:

```bash
npm run check               # lint + typecheck + build + unit tests
npm run check:ci            # adds Playwright integration/e2e coverage
npm audit --audit-level=high
```

## PR checklist

- [ ] Branch is up to date with `main`
- [ ] Fast checks pass (`npm run check`)
- [ ] Integration/E2E checks pass (`npm run check:ci`)
- [ ] No secrets committed (check `git diff` carefully)
- [ ] No new high-severity `npm audit` findings
- [ ] Commit messages follow the existing style
  (`feat:`, `fix:`, `security:`, `docs:`, `refactor:`)
- [ ] For UI changes, screenshots or a short Loom in the PR description

## Adding a new lesson

Course content lives in `src/data/<course>/modules/*.js` (or `.json`).
Follow the existing lesson shape — either the legacy markdown format,
the rich format (`concepts` + `tasks`), or the structured format
(`hook` / `do` / `understand` / `build` / `challenge` / `summary`).

Quizzes live in `src/data/<course>/quizzes.js`, challenges in
`src/data/<course>/challenges.js`.

## Styling

- All colors, spacing, typography, and motion values come from
  [`src/styles/tokens.css`](./src/styles/tokens.css). Never hard-code
  hex colors or magic pixel values in components.
- Preview the token system at `#styleguide`.
- Global responsive breakpoints live in
  [`src/styles/responsive.css`](./src/styles/responsive.css).
  Keep component-specific responsive tweaks close to the component's
  existing style section and preserve the current section comment style.

## Code style

- React function components and hooks only (no classes).
- Destructure props, prefer named exports.
- Don't reach into `localStorage` directly — use
  [`src/hooks/useLocalStorage.js`](./src/hooks/useLocalStorage.js).
- Don't use `dangerouslySetInnerHTML` with unescaped input. See the
  two existing examples in `src/utils/markdown.jsx` and
  `src/components/panels/SearchPanel.jsx` for the safe pattern.

## Questions

Open a GitHub Discussion or reach out to
[@itcodegirl](https://github.com/itcodegirl).
