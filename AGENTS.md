# Repository Guidelines

## Project Structure & Module Organization
This repository is currently minimal. At the moment the only tracked file is `package.json` at the repo root. There is no `src/`, `test/`, or `docs/` directory yet. As the project grows, keep new code grouped by concern (for example, `src/` for application code and `tests/` for automated tests) and update this document to reflect the new layout.

## Build, Test, and Development Commands
The only configured npm script is:

```bash
npm test
```

This script currently exits with an error (`"Error: no test specified"`). Add real build and dev scripts to `package.json` as soon as the project structure is defined.

## Coding Style & Naming Conventions
No formal style guide or tooling is configured yet. Until formatting and linting are added, keep code readable and consistent within each file. If you introduce JavaScript/TypeScript:
- Use 2-space indentation.
- Prefer `camelCase` for variables/functions and `PascalCase` for classes/components.
- Name files by feature or module (for example, `graph-service.js`).

When you add a formatter or linter (for example, `prettier` or `eslint`), document the exact commands here.

## Testing Guidelines
No test framework is configured and there are no tests yet. When tests are added, document:
- The framework (for example, `jest` or `vitest`).
- Test locations (for example, `tests/**/*.test.js`).
- How to run unit vs. integration tests.

## Commit & Pull Request Guidelines
There is no established commit message convention in this repository yet. If you adopt one (for example, Conventional Commits), add the rules here with examples.

For pull requests, include:
- A short description of changes.
- Any linked issues or tickets.
- Screenshots or logs when behavior changes are user-facing.

## Agent-Specific Instructions
Follow `AGENTS.md` for contributor guidance. Keep this document updated as tooling, structure, or workflows evolve.
