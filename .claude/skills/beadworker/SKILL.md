---
name: beadworker
description: Work a beads issue end-to-end — fetch, verify, claim, branch, implement, commit, and comment. Usage: /beadworker <id>
---

<command-name>beadworker</command-name>

# Beadworker Skill

Work a single beads issue from triage to committed code.

## Arguments

`args` contains the issue ID (e.g. `beads-abc`).

## Steps

Execute these steps in order. Stop and surface any blocker to the user before continuing.

### 1. Fetch the issue

Run `bd show <id> --long --json` and parse the result. Read the title, description, acceptance criteria, design, notes, dependencies, and status.

### 2. Verify the issue

Before claiming anything, assess whether the issue is workable:

- **Title** — clear and specific (not "fix bug" or "improve stuff")
- **Description** — explains _why_ this issue exists and _what_ needs to be done; enough context to implement without guessing
- **Scope** — implementable as a single focused change; not underspecified or impossibly large
- **Dependencies** — all blocking issues are closed (check `dependency_type: "blocks"`)
- **No conflicting information** — design decisions don't contradict the description

If the issue **fails any check**, do NOT proceed. Instead:

1. Post a comment: `bd comment <id> --actor "Claude" "Verification failed: <specific reason>. Needs: <what is missing or unclear>."`
2. Report to the user what was wrong and stop.

If the issue **needs clarification** but is otherwise sound, do NOT proceed. Instead:

1. Post a comment: `bd comment <id> --actor "Claude" "Question before starting: <specific question>"`
2. Report to the user and stop.

### 3. Claim the issue and enrich it

Once verified:

1. Claim: `bd update <id> --claim`
2. Update acceptance criteria if not already precise: `bd update <id> --acceptance="<criteria>"`
3. Update design notes with your implementation approach: `bd update <id> --design="<approach>"`
4. Update notes with any constraints or decisions: `bd update <id> --notes="<notes>"`

Keep these concise and factual — they are permanent record.

### 4. Checkout a branch and create a worktree

Derive a short kebab-case branch name from the issue title (e.g. `fix-char-limit`, `add-dark-mode`). Create it off `main`
and create a brand new worktree in `~/Projects/worktrees`:

```
git worktree add -b <short-description> ~/Projects/worktrees/<short-description> main
cd ~/Projects/worktrees/<short-description>
npm install
```

Do all your work within the new worktree. Do not make changes in the main project directory.

### 5. Implement

Work the issue to completion. Follow all project conventions from CLAUDE.md:

- No TypeScript — `.js` / `.jsx` only
- No comments unless the WHY is non-obvious
- No features beyond what the issue requires
- No test runner configured — validate via the dev server where applicable

Read the relevant source files before editing. Prefer editing existing files over creating new ones.

### 6. Format & Lint

Run `npm run format` to apply code formatting. Run `npm run lint` to check for linting errors. Repeat until all issues are resolved.

Do not disable linter rules or add exceptions. If the code doesn't fit the rules, it needs to be refactored until it does.

### 7. Commit

Stage any resulting changes together with your implementation changes.

Stage only the files changed for this issue. Write a conventional commit — **no scope**, no mention of the issue ID. Include a body if the change warrants calling out non-obvious details (e.g. a tricky workaround, a subtle invariant, why an approach was chosen over an alternative):

```
git commit -m "$(cat <<'EOF'
<type>: <imperative summary under 72 chars>

[optional body — only if details warrant it]
EOF
)"
```

Include `Co-authored-by: ` trailers with the appropriate model name.

Valid types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`.

### 8. Leave a completion comment

```
bd comment <id> --actor "Claude" "Implemented and committed on branch <branch-name>. Ready for review."
```

Then report to the user: what was done, what branch, and the commit hash.

## Important: Do NOT close the issue

**Never run `bd close <id>`** at the end of this skill. The issue stays open for human review and merge before closing.
