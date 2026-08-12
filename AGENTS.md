# AGENTS.md

Guidance for AI agents working in this repository.

## Repo layout

- `server/` — the only deployable package: an Express 5 + TypeScript REST API (Mongoose, Zod, JWT, Multer). **All server conventions live in [`server/AGENTS.md`](server/AGENTS.md); setup/docs live in [`server/README.md`](server/README.md).**
- `bruno/` — Bruno API collection (OpenCollection YAML) for manually exercising the API. **Bruno conventions live in [`bruno/AGENTS.md`](bruno/AGENTS.md).**
- `.github/workflows/` — GitHub Actions: `pr.yml` (checks on PRs), `deploy.yml` (on push to `main`, calls the shared reusable `quality.yml` then triggers a Render deploy hook), the shared `quality.yml` (lint → typecheck → test → build), and `opencode.yml` (AI agent you trigger by commenting — see below).
- `.agents/skills/` — AI skills for this project, usable by any AI agent: `bruno-collection-generator`, `node`, `code-review`, `grill-me` (plus deps `grilling`, `setup-matt-pocock-skills`). Invoke them when the task matches their `description`.

## Root gotchas

- The root `.gitignore` ignores `.env`, `node_modules`, `dist`, `uploads`, and `coverage`.
- There is **no root `package.json`** — all commands run inside `server/`.
- CI test env vars come from GitHub secrets (`TEST_MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) — see `server/AGENTS.md`.

## OpenCode agent

The repo ships an AI coding agent you can trigger from a GitHub issue or PR review, via [`.github/workflows/opencode.yml`](.github/workflows/opencode.yml). It runs OpenCode (model `opencode-go/deepseek-v4-flash`) against the repo.

### How to use

1. Make sure the `OPENCODE_API_KEY` repository secret is set (Settings → Secrets and variables → Actions). Without it the job fails.
2. On an **issue** or a **PR review**, post a comment containing `opencode` or `oc` (e.g. `"opencode review this diff"`, `"/opencode what's the issue here?"`).
3. The `opencode.yml` workflow triggers, checks out the repo, and runs OpenCode against it; OpenCode replies in the conversation.

> Only repo **maintainers** (owner, members, collaborators) can trigger it — comments from other users are ignored.

### What it does

- **Triggers** on new issue comments and PR review comments whose body contains `opencode` (or `oc`) — `startsWith` or `contains` with a space prefix, so `"/opencode ..."` or a comment mentioning `" opencode"` both fire it.
- **Model**: `opencode-go/deepseek-v4-flash` (set in the workflow `with.model`).
- **Access**: only repo **maintainers** (`OWNER` / `MEMBER` / `COLLABORATOR` via `author_association`) can trigger it; comments from other users are ignored.
- **Auth**: reads `OPENCODE_API_KEY` from repo secrets.
- **Permissions**: read-only (`contents`, `pull-requests`, `issues` read; `id-token: write` for the action's cloud auth). It can analyze/review the checked-out code and reply, but **cannot push changes** by itself.
- **Note**: only runs on comments — there is no manual "Run workflow" dispatch.
