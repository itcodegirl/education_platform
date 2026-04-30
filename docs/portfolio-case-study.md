# Portfolio Case Study: CodeHerWay

## Executive summary

CodeHerWay is a production-minded learning platform built to improve first-time coding confidence while preserving technical rigor. The project balances product clarity, secure architecture, and incremental delivery discipline.

This case study highlights how the platform was hardened for portfolio review across UX, accessibility, release readiness, and developer workflow quality.

---

## Problem and opportunity

Beginner coding platforms often struggle with two issues:

1. learners do not know what to do next after login
2. projects look polished in screenshots but lack production fundamentals

The goal was to keep the existing core vision and architecture intact while making the product feel more intentional, trustworthy, and demonstrably shippable.

---

## Product goals

- Make the first 30 to 60 seconds clear and guided.
- Improve dashboard and lesson flow clarity.
- Strengthen keyboard and accessibility behavior.
- Standardize visual patterns without overdesign.
- Raise release confidence with explicit quality gates.
- Present the project clearly for recruiters and technical reviewers.

---

## Scope and constraints

- No full rewrite.
- No unnecessary feature expansion.
- Preserve architecture unless a change clearly improved maintainability.
- Deliver in small, verifiable batches with checks after each batch.

---

## Architecture and technical context

### Frontend

- React 18 + Vite
- tokenized CSS and shared UI primitives
- modular component organization by domain (auth, learning, panels, admin, shared)

### Data and auth

- Supabase Auth + Postgres
- Row Level Security as primary authorization boundary

### Server-side capabilities

- Netlify Functions for AI and scheduled workflows
- OpenAI Responses API accessed only through server functions

### Quality workflow

- ESLint, Vitest, and Playwright
- scripted quality gates for local and CI parity
- authenticated smoke coverage that runs when test credentials are configured and self-skips locally when they are not

---

## What was improved

### 1. First-run and UX clarity

- Sharper CTA hierarchy in entry flow
- clearer onboarding and "next step" language
- improved empty states and helper copy where users previously hit dead ends

### 2. Visual consistency

- standardized controls and state surfaces (buttons, inputs, status blocks)
- harmonized card/panel spacing, radii, and border rhythm
- improved consistency across lesson, panel, and dashboard surfaces

### 3. Accessibility hardening

- keyboard and focus behavior tightened across overlays/modals
- improved semantic and ARIA relationships in dialogs and quiz interactions
- reduced fragile interaction patterns

### 4. Code-health and workflow quality

- improved root scripts for clear unit/integration/release gates
- aligned README, CONTRIBUTING, and release checklist with actual commands
- separated badge catalog metadata from React progress context
- aligned badge eligibility logic with the actual reward catalog
- hardened transient toast feedback so new messages cannot be hidden by stale timers
- maintained small, intentional commits with check-backed verification

---

## Key technical tradeoffs

### Tradeoff: polish speed vs architectural churn

Decision: optimize within current architecture instead of introducing a new state/design framework.

Why: reduced risk, preserved momentum, and kept changes reviewable.

### Tradeoff: richer UX semantics vs test stability

Decision: align ARIA semantics with test expectations and accessibility best practices instead of forcing custom patterns.

Why: prevented regressions while improving screen reader and keyboard behavior.

### Tradeoff: strict release confidence vs local iteration speed

Decision: use simple command gates (`check`, `check:ci`) to keep both fast feedback and CI parity.

Why: stronger release confidence without a complex pipeline redesign.

---

## Security and accessibility posture

### Security

- server-mediated AI integration with authenticated access patterns
- backend-enforced data isolation via RLS
- deployment-level security headers and baseline hardening
- CI checks for dependency and secret-risk visibility

### Accessibility

- stronger dialog semantics (`aria-labelledby` and `aria-describedby`)
- improved keyboard navigation and focus states
- cleaner interaction semantics in quiz, search, and sidebar flows

---

## Outcomes

- clearer user path from landing to lesson completion
- more consistent, premium-feeling UI without sacrificing readability
- stronger confidence in release quality through explicit checks
- clearer portfolio narrative for both non-technical and technical reviewers

---

## Demo walkthrough for interviews

1. Start at landing/auth and describe target learner.
2. Show first-run guidance and dashboard orientation.
3. Open a lesson, show progress and next-step signaling.
4. Open search/bookmarks/review to demonstrate learning continuity.
5. Explain AI architecture and security boundary.
6. Close with quality gates and release checklist.

---

## What I would do next

- add final screenshot assets in `docs/screenshots/`
- add Lighthouse CI scoring and budget reporting
- add richer analytics for onboarding drop-off and lesson completion friction
- continue incremental CSS modularization to reduce global stylesheet surface area

---

## Project story (resume-friendly)

Built and hardened a multi-track SaaS-style coding education platform with secure AI integration, accessible interaction design, and release-grade quality workflow. Improved onboarding clarity, consistency, and maintainability through targeted, check-validated iterations without a full architectural rewrite.

