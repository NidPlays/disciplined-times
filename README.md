# Disciplined Times

A website for planning **hours per goal** and logging time in quick taps. It works in any desktop or mobile browser, and you can optionally install it as an app (PWA) on iOS, Android and desktop.

**Live:** https://nidplays.github.io/disciplined-times/

- Create goals and plan time **per day, per week, or per month**.
- Daily goals repeat on the weekdays you pick (Every day / Weekdays / Weekends / custom). They can also have **different hours per weekday**, e.g. 1h Mon–Thu and 3h on Saturday.
- Week and month goals show progress for the whole period plus a **suggested pace for today**.
- Tap the big **+30** button to log time. The step size is set per goal. Other amounts and corrections are one tap away, and every log can be undone.
- A **Week** view shows a bar chart of logged time against the plan, plus a per-goal heat strip.
- **Works as a normal website.** On desktop it has a sidebar, a multi-column layout and keyboard shortcuts (`N` new goal, `1`–`4` switch tabs, `←`/`→` change day, `T` today). Tabs live in the URL hash (`#week`, `#goals`), so browser back/forward and bookmarks work.
- **Installs as an app** on iOS, Android and desktop, and works offline. All data stays on the device, with JSON export and import for backups.

![Desktop](docs/desktop.png)

| Today | New goal | Week |
| --- | --- | --- |
| ![Today](docs/today.png) | ![Editor](docs/editor.png) | ![Week](docs/week.png) |

## Stack

- [Bun](https://bun.sh) for package management, scripts and tests (`bun test`)
- [Vite 8](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (Workbox) for the service worker, manifest and update prompt
- [Zustand](https://zustand.docs.pmnd.rs) (with `persist`) for local storage, and [date-fns](https://date-fns.org) for dates

Next.js is not used, on purpose. The app has no server, no SEO-critical pages and no auth. A static Vite SPA is simpler, loads faster offline and can be hosted anywhere: GitHub Pages, Netlify, Cloudflare Pages or Vercel.

## Develop

```sh
bun install
bun run dev        # http://localhost:5173 (service worker disabled in dev)
bun test           # unit tests for the scheduling logic
bun run build      # type-check + production build in dist/
bun run preview    # serve dist/ to test install/offline behaviour
bun run icons      # regenerate PNG icons from public/logo.svg
bun run build:pages && bun run preview:pages   # test the GitHub Pages build at /disciplined-times/
```

## Deploy

### GitHub Pages (current)

`.github/workflows/deploy.yml` tests and builds on every push and PR, and deploys pushes to `main`.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The build reads `BASE_PATH` from `actions/configure-pages`, so the site works at `/<repo>/` and also with a custom domain (base `/`). Navigation is hash-based, so no `404.html` SPA workaround is needed.

### Cloudflare (later)

Run `bun run build` (base `/`) and serve `dist/` as static assets, using Workers static assets or Pages. No other changes are needed.

## Home-screen shortcuts & deep links

| URL | What it does |
| --- | --- |
| `?action=quick-log&minutes=30` | Opens a sheet where one tap adds 30 min to a goal |
| `?log=<goalId>&minutes=30` | Adds 30 min to that goal immediately (with an Undo toast) |
| `?action=new-goal` | Opens the new-goal form |
| `#week`, `#goals`, `#settings` | Opens a tab (also `?tab=week`) |

The manifest declares **app shortcuts** for "+30 min", "Today" and "New goal". On Android (Chrome) and desktop Chrome/Edge, long-press or right-click the installed icon to use them. To get a per-goal `?log=` link, use the 🔗 button in the Goals tab.

### Platform notes

- **Desktop browsers**: everything works without installing. Chrome and Edge can also install it as a windowed app, with shortcuts on right-click.
- **Android**: full install prompt and manifest shortcuts.
- **iOS / iPadOS**: install from Safari via Share → *Add to Home Screen*. Safari does not support manifest shortcuts.
- **Widgets**: PWAs can't add home-screen widgets on iOS or Android today. Only Windows (Edge) implements the PWA widgets spec. The closest cross-platform options are the shortcuts and deep links above.

## Data model

```ts
Goal     { id, name, emoji, color, period: 'day'|'week'|'month',
           dayTargets: { [weekday 0-6]: minutes },  // daily goals
           periodTarget: minutes,                    // week / month goals
           step: minutes, archived }
LogEntry { id, goalId, minutes, date: 'yyyy-MM-dd', at }
```

Scheduling and progress logic lives in `src/lib/schedule.ts` and is covered by `src/lib/schedule.test.ts`.

## License

MIT
