# CLAUDE.md

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` for full workflow context.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

---

## Git

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): message`

Common types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`

## Commands

```bash
npm run dev      # Start dev server (React Router + Vite, http://localhost:5173)
npm run build    # Production build → build/client/ + build/server/
npm start        # Run production server (requires npm run build first)
```

No test runner or linter is configured yet.

## Architecture

**beadee** is a web GUI for the `bd` (beads) CLI issue tracker. It shells out to `bd --json` for all data — there is no direct database access. TypeScript throughout — all `.ts` / `.tsx`. Exceptions: `bin/beadee.js` (CLI entrypoint with shebang) and `server/server.js` (runs directly in Node, outside Vite).

### Key architectural constraints

**SSE feedback loop prevention**: Every `bd` invocation (even reads) writes to `.beads/interactions.jsonl`, which triggers `fs.watch`. All route handlers call `suppressWatch()` before `bdRun` to suppress the watcher for 2 seconds. Mutation routes also call `broadcast()` after `bdRun` for immediate client notification.

### Data flow

```
Browser → fetch /api/*
  → RR7 resource route (app/routes/api.*.ts)
    → bdRun() in server/bd.ts
      → bd CLI subprocess (process.cwd() = user's project dir)
        → Dolt DB
```

Real-time updates:

```
External bd write → .beads/ file change → fs.watch in server/sse.ts
  → broadcast() → SSE event → useIssues subscriber → refetch /api/issues

Mutation via UI → route action → suppressWatch() + broadcast()
  → SSE event → refetch (fs.watch event suppressed for 2s)
```

### Themes

Themes are CSS custom property sets on `[data-theme='X']` in `src/index.css`. Theme is stored in `localStorage('beadee-theme')` and applied before first paint via an inline `<script>` in `app/root.jsx`.

### SSR note

`ssr: true` is set in `react-router.config.ts` because API routes need server-side `bd` execution. `root.tsx` guards `localStorage` access with `typeof window !== 'undefined'` checks to avoid SSR crashes. UI hooks (`useIssues`, etc.) use `useEffect` so they only run client-side.
