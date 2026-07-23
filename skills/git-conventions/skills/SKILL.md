---
name: git-conventions
description: Enforce Conventional Commits with structured body, pre-commit checks, and safe git defaults — use when making any git commit
---

# Git Conventions Skill

Git commit conventions for Claude Code. Auto-enforced after installation, works with any project.

## Core Principles

1. **Auto-commit**: Stage and commit task-related changes by default. Skip only when user explicitly says "don't commit" or "commit later".
2. **Precise staging**: Run `git status` and `git diff` before every commit. Only include files produced by the current task.
3. **Protect user changes**: Never overwrite, revert, clean up, or mix the user's existing changes into the current commit.
4. **No destructive operations**: Never use `reset --hard`, `clean -fd`, `push --force`, etc. unless the user explicitly authorizes it.

## Commit Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <subject, max 50 chars>

- [<action>] <key change 1>
- [<action>] <key change 2>
```

### Types

| Type       | Purpose                                |
| ---------- | -------------------------------------- |
| `feat`     | New user or system capability          |
| `fix`      | Bug fix                                |
| `docs`     | Documentation only                     |
| `refactor` | Code restructuring, no behavior change |
| `test`     | Adding or adjusting tests              |
| `perf`     | Performance improvement                |
| `build`    | Build system or dependency changes     |
| `chore`    | Other maintenance tasks                |

### Scope

Choose a scope that accurately describes the **boundary of change**. Common examples:

`api`, `web`, `db`, `infra`, `ci`, `deps`, `auth`, `ui`, or a module/feature name specific to the project. Omit when the change spans the entire project.

### Action Labels (Body)

| Label        | Purpose                         |
| ------------ | ------------------------------- |
| `[Add]`      | New feature, resource, or file  |
| `[Fix]`      | Fix an error or inconsistency   |
| `[Refactor]` | Structural change, no behavior  |
| `[Docs]`     | Documentation or comment update |
| `[Test]`     | Test addition or adjustment     |
| `[Chore]`    | Config, build, or maintenance   |

Body is optional but **recommended** for cross-module changes, behavior changes, or when there are important verification results. Wrap body lines at ~72 columns. Only use labels that match the actual diff.

## Pre-Commit Checklist

- [ ] Diff contains **only** current task content
- [ ] User's existing changes are **preserved**
- [ ] Code, tests, and documentation are in the **correct location**
- [ ] Subject line accurately describes the overall change
- [ ] Type and scope match the actual content
- [ ] Known issues are **documented in the body**, not hidden by misleading messages

## Examples

```text
feat(auth): add OAuth2 login flow

- [Add] implement OAuth2 authorization code grant
- [Add] add callback endpoint for token exchange
- [Test] add integration tests for login flow
```

```text
fix(api): handle null response from payment gateway

- [Fix] add null check before parsing payment status
- [Test] add edge case test for empty gateway response
```

```text
refactor(db): extract query builder into dedicated module

- [Refactor] move query construction from repository to QueryBuilder class
- [Docs] update API documentation with new module reference
```

```text
chore(deps): upgrade TypeScript to 5.4

- [Chore] update typescript and @types/node to latest
- [Fix] resolve type errors introduced by new compiler
```
