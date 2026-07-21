# git-conventions

Enforce [Conventional Commits](https://www.conventionalcommits.org/) with structured body, pre-commit checks, and safe git defaults for any project.

## What It Does

When installed, Claude Code follows these conventions for all commits:

- **Conventional Commits format** — `type(scope): subject` with optional structured body
- **Action labels** — `[Add]`, `[Fix]`, `[Refactor]`, `[Docs]`, `[Test]`, `[Chore]` in commit body
- **Pre-commit checklist** — verifies diff scope, user change preservation, and message accuracy
- **Safe defaults** — no destructive commands, auto-stage only task-related files

## Types

| Type       | Purpose                         |
| ---------- | ------------------------------- |
| `feat`     | New capability                  |
| `fix`      | Bug fix                         |
| `docs`     | Documentation only              |
| `refactor` | Restructure, no behavior change |
| `test`     | Test changes                    |
| `perf`     | Performance improvement         |
| `build`    | Build/dependency changes        |
| `chore`    | Maintenance                     |

## Example

```text
feat(auth): add OAuth2 login flow

- [Add] implement OAuth2 authorization code grant
- [Add] add callback endpoint for token exchange
- [Test] add integration tests for login flow
```

## Installation

```bash
/plugin install git-conventions
```

## License

[MIT](../../LICENSE)
