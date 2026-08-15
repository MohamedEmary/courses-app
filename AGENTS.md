# AGENTS.md

Guidance for AI agents working in this repository.

## Repo layout

- `server/`: the only deployable package, an Express 5 + TypeScript REST API (Mongoose, Zod, JWT, Multer). **All server conventions live in [`server/AGENTS.md`](server/AGENTS.md); setup/docs live in [`server/README.md`](server/README.md).**
- `bruno/`: Bruno API collection (OpenCollection YAML) for manually exercising the API. **Bruno conventions live in [`bruno/AGENTS.md`](bruno/AGENTS.md).**
- `.github/workflows/`: GitHub Actions. `pr.yml` (checks on PRs), `deploy.yml` (on push to `main`, calls the shared reusable `quality.yml` then triggers a Render deploy hook), the shared `quality.yml` (lint → typecheck → test → build), and `opencode.yml` (AI agent you trigger by commenting; see below).
- `.agents/skills/`: AI skills for this project, usable by any AI agent. `bruno-collection-generator`, `node`, `code-review`, `grill-me` (plus deps `grilling`, `setup-matt-pocock-skills`). Invoke them when the task matches their `description`.

## Root gotchas

- The root `.gitignore` ignores `.env`, `node_modules`, `dist`, `uploads`, and `coverage`.
- There is **no root `package.json`**: all commands run inside `server/`.
- CI test env vars come from GitHub secrets (`TEST_MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`); see `server/AGENTS.md`.
- **Consistency matters**: match the existing patterns in whichever folder you touch: imports, naming, JSDoc, request files, docs. Never introduce a style that differs from its neighbours (e.g. all `src/` imports use the `@/` alias; see `server/AGENTS.md`).

## Writing rules (hard rules)

- **No em dashes.** Never use the em dash character (`—`) in docs, comments, commit messages, or chat replies. Use commas, colons, parentheses, or a plain hyphen instead.
- **No buzz words.** Avoid vague, marketing-style words such as _robust_, _seamless_, _leverage_, _streamline_, _cutting-edge_, _comprehensive_, _high-performance_, _world-class_, _innovative_, or _scalable_. Say what something does, plainly and specifically.

## Scope (hard rule)

- **Stay in scope.** Only edit files the current task requires. Do not change files outside that scope, even if you notice issues in them; flag those to the user instead of editing. In particular, never touch `other/` (personal notes) unless the task explicitly asks you to.

## Keep docs in sync

After every change, update the project docs it affects **before finishing**: docs must reflect the code at the end of the task, not lag behind it.

- `server/README.md`: endpoint additions/removals, validation rules, env vars, scripts, conventions.
- `bruno/` collection (`opencollection.yml` + request files): every endpoint change (see `bruno/AGENTS.md`).
- Root `index.html`: the GitHub Pages API-docs page that inlines the Bruno collection. Ask the user to regenerate it after any `bruno/` change, and remind them to re-link `bruno/api-docs-fix.js` (the injected viewer fix) after every regeneration. When collection changes affect the viewer patch, update `bruno/api-docs-fix.js` too (see `bruno/AGENTS.md`; the agent must not create `index.html`).
- `AGENTS.md` / `server/AGENTS.md` / `bruno/AGENTS.md`: when code or conventions change, keep the guidance accurate.
- Root `README.md`: repo layout / feature overview changes.

**README vs AGENTS separation**: `README.md` files are for humans (setup, usage, API reference); `AGENTS.md` files are for AI agents (conventions, rules). Never put agent rules/conventions (imports, JSDoc, tests, coverage, lint) in a README; they belong in the matching `AGENTS.md`. A README may only _point to_ `AGENTS.md`, never restate its rules.

## Testing

- Don't rerun the test suite unless a change can affect test behavior, e.g. edits to tested code or test files, or fixing a failing test.
- Skip reruns for changes that can't affect tests: comments, docs/READMEs, config, and Bruno request files (the Bruno collection has no automated tests).
- For code changes, still run `pnpm typecheck` and `pnpm lint`; they catch compile/format issues without a full test run.
- Always run `pnpm lint:fix` on code changes; it auto-fixes formatting and import organization (biome `check --write`), so the remaining `pnpm lint` output is only what the linter can't fix automatically (like the intentional `any` warnings).
- Keep **100% test coverage**: new or edited code must be covered by tests. Run `pnpm test:coverage` (v8 provider over `src/**`, excluding `main.ts`) and add tests for any uncovered statements or branches.

## OpenCode agent

The repo ships an AI coding agent you can trigger from a GitHub issue or PR review, via [`.github/workflows/opencode.yml`](.github/workflows/opencode.yml). It runs OpenCode (model `opencode-go/deepseek-v4-flash`) against the repo.

### How to use

1. Make sure the `OPENCODE_API_KEY` repository secret is set (Settings → Secrets and variables → Actions). Without it the job fails.
2. On an **issue** or a **PR review**, post a comment containing `opencode` or `oc` (e.g. `"opencode review this diff"`, `"/opencode what's the issue here?"`).
3. The `opencode.yml` workflow triggers, checks out the repo, and runs OpenCode against it; OpenCode replies in the conversation.

> Only repo **maintainers** (owner, members, collaborators) can trigger it; comments from other users are ignored.

### What it does

- **Triggers** on new issue comments and PR review comments whose body contains `opencode` (or `oc`): `startsWith` or `contains` with a space prefix, so `"/opencode ..."` or a comment mentioning `" opencode"` both fire it.
- **Model**: `opencode-go/deepseek-v4-flash` (set in the workflow `with.model`).
- **Access**: only repo **maintainers** (`OWNER` / `MEMBER` / `COLLABORATOR` via `author_association`) can trigger it; comments from other users are ignored.
- **Auth**: reads `OPENCODE_API_KEY` from repo secrets; authenticates to GitHub with the workflow's built-in `GITHUB_TOKEN` (`use_github_token: true`), so replies/commits come from `github-actions[bot]`; no OpenCode GitHub App installation needed.
- **Permissions**: `contents`, `pull-requests`, `issues` **write** (plus `id-token: write` for the action's cloud auth). It can analyze/review the checked-out code, reply in the conversation, and, if asked, push branches and open PRs.
- **Note**: only runs on comments; there is no manual "Run workflow" dispatch.
