# CodeHerWay Learning Platform

Interactive coding education platform with course content, quizzes, code challenges, Supabase-backed progress sync, and AI tutoring through a Netlify Function.

## Stack

- React 18 + Vite
- Supabase Auth + Postgres
- Netlify static hosting + Netlify Functions
- OpenAI Responses API for server-side AI features

## Features

- Four course tracks: HTML, CSS, JavaScript, and React
- Lesson progress, bookmarks, notes, badges, streaks, and spaced repetition
- Search, glossary, cheatsheets, and project ideas
- Monaco-powered code preview and coding challenges
- AI tutor and code help routed through a server-side function

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Copy [`.env.example`](./.env.example) to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

Required in `.env` for the frontend:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Configure Supabase

1. Create a Supabase project.
2. Run [`supabase-schema.sql`](./supabase-schema.sql) in the SQL editor.
3. Enable Email auth.
4. Optionally enable Google and GitHub OAuth providers.
5. Copy the project URL and anon key into `.env`.

### 4. Run the app

```bash
npm run dev
```

## AI Setup

The frontend does not call model providers directly. AI requests go through [`netlify/functions/ai.js`](./netlify/functions/ai.js), which keeps the provider key off the client.

Set these server-side environment variables where your Netlify Functions run:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.4-mini
```

Notes:

- `OPENAI_API_KEY` is required for AI features.
- `OPENAI_MODEL` is optional. The function defaults to `gpt-5.4-mini`.
- Do not put `OPENAI_API_KEY` in client-side `VITE_` variables.

## Netlify Deploy

This repo is already configured for Netlify in [`netlify.toml`](./netlify.toml):

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

In Netlify, add these environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- Optional: `OPENAI_MODEL`

For repeatable release QA, use [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md).

After deploy, test:

1. Sign up or sign in.
2. Complete a lesson and confirm progress syncs.
3. Open the AI tutor or challenge help and confirm the function responds.

## GitHub Automation

This repo includes lightweight GitHub automation:

- [`.github/workflows/ci-smoke.yml`](./.github/workflows/ci-smoke.yml): build check for PRs and pushes to `main`
- [`.github/workflows/ops-checks.yml`](./.github/workflows/ops-checks.yml): weekly dependency audit and optional live-site health check

To enable live-site health checks, add a GitHub repository variable:

- `PRODUCTION_URL`

Example:

```text
https://mellow-sunflower-9c92cd.netlify.app
```

The health check pings the homepage and the Netlify AI function without requiring production secrets.

## Project Structure

```text
src/
  components/
  context/
  data/
  hooks/
  layouts/
  lib/
  providers/
  routes/
  services/
  styles/
  utils/
netlify/
  functions/
public/
supabase-schema.sql
netlify.toml
vite.config.js
```

## Key Files

- [`src/lib/supabaseClient.js`](./src/lib/supabaseClient.js): Supabase client bootstrap
- [`src/context/ProgressContext.jsx`](./src/context/ProgressContext.jsx): synced learning progress and gamification state
- [`src/services/authService.js`](./src/services/authService.js): auth operations
- [`src/services/aiService.js`](./src/services/aiService.js): frontend AI requests
- [`netlify/functions/ai.js`](./netlify/functions/ai.js): server-side OpenAI proxy

## Future AI Direction

If you later want an orchestrated AI engine, this setup is a good base. The recommended path is to keep orchestration behind server routes or functions and let the frontend call your own app-level AI endpoints for tutor flows, memory, moderation, and tool use.
