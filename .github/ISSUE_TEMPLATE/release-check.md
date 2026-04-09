---
name: Release Check
about: Track production deploy validation using the repo release checklist
title: "Release check: "
labels: ["release"]
assignees: []
---

## Release Info

- Commit SHA:
- Netlify deploy URL:
- Production URL:

## Pre-Deploy

- [ ] Branch is correct
- [ ] Working tree was clean before release
- [ ] `npm run build` passed
- [ ] Required env vars are present

## Smoke Test

- [ ] Sign in works
- [ ] Lesson flow works
- [ ] Bookmark flow works
- [ ] Continue Learning works
- [ ] AI Tutor works
- [ ] Challenge AI help works
- [ ] Mobile sidebar works

## PWA / Cache

- [ ] No chunk-load errors
- [ ] No stale bundle behavior after refresh
- [ ] Service worker behavior looks healthy

## Sign-Off

- [ ] Netlify subdomain verified
- [ ] Production domain verified
- [ ] Release approved

Reference: [`RELEASE_CHECKLIST.md`](../../RELEASE_CHECKLIST.md)
