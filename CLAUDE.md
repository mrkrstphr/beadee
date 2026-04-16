# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

---

## Shell commands

Always use non-interactive flags — some systems alias `cp`/`mv`/`rm` with `-i`:

```bash
cp -f src dst      rm -f file      rm -rf dir      cp -rf src dst
```

## Commands

```bash
npm run dev      # Start dev server (React Router + Vite, http://localhost:5173)
npm run build    # Production build → build/client/ + build/server/
npm start        # Run production server (requires npm run build first)
```

No test runner or linter is configured yet.

## Architecture

**beadee** is a web GUI for the `bd` (beads) CLI issue tracker. It shells out to `bd --json` for all data — there is no direct database access. No TypeScript — all `.js` / `.jsx`.

### Key architectural constraints

**Embedded Dolt single-writer lock**: `bd` uses an embedded Dolt database that only allows one writer at a time. Concurrent `bdRun` calls will contend for the lock. `server/bd.js` retries up to 4 times with exponential backoff (80ms base) on lock errors. Never run parallel `bdRun` calls.

**SSE feedback loop prevention**: Every `bd` invocation (even reads) writes to `.beads/interactions.jsonl`, which triggers `fs.watch`. All route handlers call `suppressWatch()` before `bdRun` to suppress the watcher for 2 seconds. Mutation routes also call `broadcast()` after `bdRun` for immediate client notification.

### Data flow

```
Browser → fetch /api/*
  → RR7 resource route (app/routes/api.*.js)
    → bdRun() in server/bd.js
      → bd CLI subprocess (process.cwd() = user's project dir)
        → Embedded Dolt DB in .beads/
```

Real-time updates:
```
External bd write → .beads/ file change → fs.watch in server/sse.js
  → broadcast() → SSE event → useIssues subscriber → refetch /api/issues

Mutation via UI → route action → suppressWatch() + broadcast()
  → SSE event → refetch (fs.watch event suppressed for 2s)
```

### Themes

Themes are CSS custom property sets on `[data-theme='X']` in `src/index.css`. Theme is stored in `localStorage('beadee-theme')` and applied before first paint via an inline `<script>` in `app/root.jsx`.

### SSR note

`ssr: true` is set in `react-router.config.js` because API routes need server-side `bd` execution. `App.jsx` guards `localStorage` access with `typeof window !== 'undefined'` checks to avoid SSR crashes. UI hooks (`useIssues`, etc.) use `useEffect` so they only run client-side.
