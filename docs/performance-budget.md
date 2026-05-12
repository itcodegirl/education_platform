# Performance Budget

Use this budget as the working ceiling for performance-focused PRs. It is intentionally conservative for the public shell and explicit about heavy authenticated tooling.

| Surface | Budget | Why it matters |
| --- | ---: | --- |
| Initial JavaScript gzip | 170 kB | Keeps logged-out and first-run visits responsive on mobile connections. |
| Initial CSS gzip | 12 kB | Protects first paint and avoids shipping authenticated UI styles to public entry. |
| Main app chunk gzip | 120 kB | Prevents shared app code from growing without review. |
| Initial stylesheet gzip | 45 kB | Allows the current CSS architecture while still catching large regressions. |
| Protected app stylesheet gzip | 45 kB | Keeps authenticated shell styling behind the route boundary. |
| Course runtime data chunk | 260 kB raw / 80 kB gzip | Keeps expanding curriculum chunks visible while preserving per-course lazy loading. |
| General lazy JavaScript chunk | 700 kB raw | Forces large learning/tooling chunks to stay intentional. |
| Monaco lazy chunks | 1,900 kB raw each | Tracks the known editor cost without pulling it into first load. |

Run `npm run audit:performance` after touching routing, Vite chunking, editor surfaces, panels, PDF/export flows, service-worker behavior, or global CSS.

Performance PRs should call out any budget change explicitly. Do not raise a budget to make a failing check pass unless the PR also explains the product tradeoff and why further splitting is not appropriate.
