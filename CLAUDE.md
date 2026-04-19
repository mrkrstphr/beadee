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
npm test         # Run tests (vitest, watch mode; CI runs a single pass automatically)
```

## Testing

Tests use **vitest** with `@testing-library/react`. Test files live colocated with their source (`useDebounce.test.ts` next to `useDebounce.ts`).

Write tests for what matters — real behavior, edge cases, and contracts that would silently break. Don't chase coverage numbers, test every code path, or write tests that just restate the implementation. If a test wouldn't catch a real bug, it probably isn't worth writing.

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

### Styling

**Colocation**: Each component or view lives in its own directory (e.g. `app/components/Footer/`) with a colocated CSS file (`Footer.css`) imported directly by the component. Global styles, shared primitives (buttons, badges, pills, etc.), and design tokens remain in `app/index.css`.

**Tailwind**: Colocated CSS files use `@reference "tailwindcss";` at the top and `@apply` for all standard utilities. Raw CSS is only used for design token values (`var(--*)`), computed values like `color-mix()`, and vendor-prefixed properties that can't go through `@apply`. Prefer named Tailwind colors (e.g. `text-amber-500`) over hardcoded hex/rgba values.

### Themes

Themes are CSS custom property sets on `[data-theme='X']` in `app/index.css`. Theme is stored in `localStorage('beadee-theme')` and applied before first paint via an inline `<script>` in `app/root.jsx`.

### SSR note

`ssr: true` is set in `react-router.config.ts` because API routes need server-side `bd` execution. `root.tsx` guards `localStorage` access with `typeof window !== 'undefined'` checks to avoid SSR crashes. UI hooks (`useIssues`, etc.) use `useEffect` so they only run client-side.
