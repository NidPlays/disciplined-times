# AGENTS.md

Guidance for AI coding agents (and humans) working in this repo. Read it before making changes.

## What this is

**Disciplined Times** is a static, offline-first PWA for planning hours per goal and logging time in quick taps. It has no server, no accounts and no backend: all data lives in the browser's `localStorage`. It deploys to GitHub Pages from `main`. See `README.md` for the full feature list.

## Stack

- **Bun** for package management, scripts and tests. Don't use npm, yarn or pnpm, and don't commit other lockfiles. `bun.lock` is the lockfile.
- **Vite 8 + React 19 + TypeScript** (strict mode, `noUnusedLocals`/`noUnusedParameters` are on).
- **Tailwind CSS 4** for styling, with semantic theme tokens (see "Styling" below).
- **Zustand** (with `persist`) for state, **date-fns** for dates, **vite-plugin-pwa** for the service worker.
- No router library: tabs live in the URL hash (`#week`, `#goals`, `#settings`).

## Layout

```
src/
  App.tsx            app shell, tabs, hash routing, deep links, keyboard shortcuts
  components/        one React component per file (Today, Week, Goals, Settings, sheets, …)
  lib/
    schedule.ts      pure scheduling/progress logic  (tested in schedule.test.ts)
    themes.ts        themes + WCAG contrast enforcement (tested in themes.test.ts)
    store.ts         persisted Zustand store, export/import
    types.ts         Goal, LogEntry, Settings
    changelog.ts     parses CHANGELOG.md for the in-app changelog (tested in changelog.test.ts)
    links.ts         external-link handling for the installed app (tested in links.test.ts)
    ui.ts            toast + haptics
public/              static assets and icons (regenerate PNGs with `bun run icons`)
docs/                screenshots used by the README
  video/             HyperFrames promo video (source, MP4 and README preview)
.github/workflows/   CI: test + build on every PR, deploy only from main
```

## Commands

```sh
bun install
bun run dev         # dev server on http://localhost:5173
bun test            # unit tests
bun run typecheck   # tsc -b
bun run build       # typecheck + production build
```

**Before every commit/PR, run `bun test` and `bun run typecheck` (or `bun run build`) and make sure both pass.** CI runs the same checks.

## Versioning (SemVer), bump once per PR

The app version lives in **`package.json` → `"version"`**. It is shown in Settings (via `__APP_VERSION__` in `vite.config.ts`), so it's what users see.

We use [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH` (x.y.z).

**Every PR must bump the version exactly once**, in the same PR, according to the biggest change it contains:

| Bump | When | Example |
| --- | --- | --- |
| **MAJOR** (`x`.0.0) | A breaking change for users: existing saved data or exported JSON can no longer be read without a migration, or a feature, deep link (`?action=…`, `?log=…`, `#tab`) or keyboard shortcut is removed or changes meaning | `1.4.2` → `2.0.0` |
| **MINOR** (x.`y`.0) | A new user-facing feature or a noticeable behaviour change that stays backward compatible | `0.1.0` → `0.2.0` |
| **PATCH** (x.y.`z`) | Bug fixes, copy tweaks, styling fixes, performance, refactors, dependency updates, CI/docs-only changes | `0.2.0` → `0.2.1` |

Rules:

- Reset the lower numbers when bumping a higher one (`0.2.3` → `0.3.0`, `0.9.1` → `1.0.0`).
- While the version is `0.y.z`, treat breaking changes as a **MINOR** bump and call them out clearly in the changelog. `1.0.0` is a deliberate decision by the maintainer, not something an agent does on its own.
- If several PRs are open at once, bump relative to whatever is on `main` when you open or update yours. Resolve version conflicts by re-bumping from `main`, never by going backwards.
- Add an entry to **`CHANGELOG.md`** under the new version (newest first) describing the user-visible change in plain language. The app shows this file under Settings → View changelog, so write for users, and stick to `## <version>` headings and `- ` bullets (`**bold**` and `` `code` `` are rendered). A test checks that the top entry matches `package.json`.
- State the bump in the PR description, e.g. "Version: 0.1.0 → 0.2.0 (minor: new swipe gesture)".
- Don't create git tags or GitHub releases unless asked.

## Data and backward compatibility

User data exists only in their browser, so **never break it**.

- The persisted store (`store.ts`, key `disciplined-times`) and the export format (`ExportShape`, `version: 1`) must keep loading old data.
- New settings go in `defaultSettings`; the store's `merge` fills them in for existing users. New optional fields on `Goal`/`LogEntry` need a safe default when absent.
- If you truly must change the shape, bump the persist/export `version`, add a migration, keep importing the old format, and add tests for it. That's a MAJOR (or MINOR while `0.x`) app version bump.

## Code style

- Match what's there: function components and hooks, 2-space indent, single quotes, no semicolons, imports at the top, `import type` for type-only imports.
- Keep pure logic (dates, schedules, progress, colours) in `src/lib/` and **add or update tests** for it. Components should stay thin.
- Use date-fns and the helpers in `schedule.ts` (`toKey`, `minutesBetween`, `targetFor`, …) instead of hand-rolled date maths. Dates are stored as local `yyyy-MM-dd` keys.
- Respect `settings.weekStartsOn` anywhere weeks are computed.
- Don't add dependencies without a clear reason; the app should stay small and work offline. No backend, analytics or tracking.
- Comments explain *why*, not *what*.

## Styling, accessibility and UX

- Use the semantic Tailwind tokens (`n-950`…`n-100`, `accent`, `accent-fg`, `on-accent`, `success`, `danger`), never hard-coded colours, so every theme works in light and dark mode.
- Text must meet **WCAG 2.2 AA** in every theme (`themes.test.ts` checks this). Don't fade text with opacity, and keep text at 12px (`text-xs`) or larger.
- Every interactive element must be keyboard reachable, have a visible focus ring and an accessible name (`aria-label` for icon-only buttons).
- Respect `prefers-reduced-motion`.
- It must work on both phones (touch, bottom tab bar) and desktop (sidebar, keyboard shortcuts). Check both layouts when changing UI. Touch gestures need a non-gesture alternative (e.g. buttons).
- If you change user-facing behaviour, update `README.md` (features, shortcuts, deep links) and, where it helps, the screenshots in `docs/`.

## Git and PRs

- Never push to `main` directly. Work on a branch and open a PR into `main`.
- Name branches `claude/<short-kebab-case-description>` describing the change (e.g. `claude/onboarding-tour`, `claude/keyboard-shortcuts-dialog`). Don't use auto-generated names like `ccr-…` or random suffixes. In a PR stack, give each branch its own descriptive name.
- Keep PRs focused on one change.
- Write commit messages (and PR titles) in [Conventional Commits](https://www.conventionalcommits.org) style: `<type>(<optional scope>): <description>`, with a short body explaining why.
  - **Types:** `feat` (user-facing feature), `fix` (bug fix), `docs`, `style` (formatting only), `refactor`, `perf`, `test`, `build` (deps, tooling), `ci`, `chore` (e.g. version bumps).
  - **Scope** (optional): the area touched, e.g. `today`, `week`, `goals`, `settings`, `onboarding`, `shortcuts`, `store`, `pwa`, `agents`.
  - **Description:** imperative, lowercase, no trailing period, about 72 characters max, e.g. `feat(week): swipe to change week`, `fix(store): keep theme when importing old backups`.
  - **Breaking changes:** add `!` after the type/scope (`feat(store)!: …`) and a `BREAKING CHANGE:` footer saying what breaks and how data is migrated.
  - The type should match the version bump: `feat` → MINOR, `fix`/`perf` and the rest → PATCH, `!` → MAJOR (MINOR while `0.x`).
- Each PR includes: the code change, tests where applicable, the version bump in `package.json`, a `CHANGELOG.md` entry and any README updates.
- Don't touch `.github/workflows/` unless the task is about CI. Deploys must stay restricted to pushes to `main` on `NidPlays/disciplined-times`.
- Don't commit build output (`dist/`, `dev-dist/`), `node_modules/` or `*.tsbuildinfo`.
