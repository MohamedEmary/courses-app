# AGENTS.md — server

Express 5 + TypeScript REST API (Mongoose, Zod, JWT, Multer). Read [`README.md`](README.md) for setup, env vars, scripts, and the API reference. This file covers agent-critical conventions **not** in the README.

## Commands (run from `server/`)

- `pnpm dev` — tsx watch (loads `.env`).
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm build` — tsup → single ESM bundle `dist/main.js`.
- `pnpm test` — Vitest (unit + integration). Also: `test:unit`, `test:integration`, `test:coverage`.
- `pnpm lint` / `lint:fix` — Biome check / auto-fix. `format` / `format:check` too.

## Layout

- Source in `src/`: `main.ts`, `app.ts`, `types.d.ts`, and `controllers/`, `middleware/`, `models/`, `routes/`, `schemas/`, `utils/`, `errors/`.
- Tests in `tests/` (unit + integration); they import app code via the `@/` alias.
- `uploads/`, `.env`, and configs (`tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `biome.jsonc`, `package.json`) live at the server root.

## Imports & the `@/` alias

- Imports that resolve into `src/` must use `@/` with explicit `.ts` extensions, e.g. `@/utils/jwt.ts`.
- Configured in `tsconfig.json` `paths` (`"@/*": ["./src/*"]` — **no `baseUrl`**, TypeScript 6 errors on it) and `vitest.config.ts` `resolve.alias`.
- Config files (e.g. `vitest.config.ts`) and tests→tests imports keep relative paths.

## Testing gotchas

- **Integration tests SKIP (they do not fail) when MongoDB is down** — a failed `beforeAll(connectTestDb)` makes Vitest report the whole suite as skipped. Start Mongo first: `docker compose up -d`. A "green" run full of `skipped` is **not** a real pass.
- Tests have **no hardcoded defaults**: `vitest.config.ts` loads `.env` via `process.loadEnvFile()` and requires `TEST_MONGODB_URI` (exposed to the app as `MONGODB_URI`), `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. CI sets these from GitHub secrets on the Vitest step of `quality.yml`.

## Environment variables

- `MONGODB_URI` — app DB connection string.
- `TEST_MONGODB_URI` — integration test DB (must end in `_test`; a safety guard in `tests/integration/helpers/testApp.ts` refuses anything else).
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV`, `PORT`.
- `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` — used **only** by docker-compose to bootstrap the local Mongo root user.

## Docker

- `docker-compose.yml` runs only MongoDB (`mongo:8.2.11`), reading the official `MONGO_INITDB_ROOT_*` names from `server/.env`. There is no app Dockerfile.

## Coding principles

- **YAGNI (You Aren't Gonna Need It)** — build only what the current task requires. No speculative abstractions, unused options, or "might need later" flexibility. Prefer the simplest thing that works; remove dead code when you find it.
- **DRY (Don't Repeat Yourself)** — extract genuinely repeated logic into one named helper (colocated by responsibility) instead of duplicating it. Balance with YAGNI: only extract for real, existing duplication — never preemptively abstract for hypothetical reuse.

## Conventions

- **JSDoc**: every function gets a JSDoc block with `@param {Type} name - description` and `@returns {Type} description` (`@returns {void}` for void handlers), matching the format used throughout `src/`. Keep comments short; avoid long prose comments, especially in config/setup files.
- **Bruno**: every endpoint has a request file in the [`bruno/`](../bruno/) collection — see `bruno/AGENTS.md`.
- **Tests**: every function has a test; test files mirror source paths and names — e.g. `src/utils/jwt.ts` ↔ `tests/unit/utils/jwt.test.ts`. Don't rerun the test suite unless a change can affect test behavior (tested code, test files, or a failing test) — skip reruns for comments, docs, and Bruno YAML.
- **Docs**: keep `README.md`, the [`bruno/`](../bruno/) collection, and this file in sync with the code — update them in the same task that changes endpoints, schemas, or conventions. `README.md` is for humans; this file is for AI agents — keep agent rules/conventions here and only _point_ to them from the README (never restate them there).
- **Shared schemas/types**: extract genuinely repeated schemas, types, and helpers into one shared file and import directly from it (e.g. `PaginationSchema`/`PaginationQuery` in `src/schemas/shared/pagination.schema.ts`, `objectIdParamSchema` in `src/schemas/shared/objectId.schema.ts`). Don't re-export shared items through resource-specific files like `course.schema.ts` — consumers import from the shared file directly.
- **Consistency**: match the existing codebase in every change — imports, naming, JSDoc, file layout, error messages, response envelope. New files must follow the same conventions as their neighbours (e.g. every `src/` import uses the `@/` alias with an explicit `.ts` extension — never a relative `./` import). Before finishing, review the diff for anything that deviates from the surrounding code and fix it (see the "Imports & the `@/` alias" section above).
- **Lint**: always run `pnpm lint:fix` on code changes (biome `check --write` auto-fixes formatting and import organization); the remaining `pnpm lint` output is then only issues that can't be auto-fixed (the intentional `any` warnings). Also run `pnpm typecheck` on code changes.
- **Coverage**: keep **100% test coverage** — `pnpm test:coverage` (v8 provider over `src/**`, excluding `main.ts`). Add a test for any uncovered statement/branch in new or edited code; don't ship code that drops coverage below 100%.
- **Utils**: helpers live in `src/utils/` with a filename matching the exported function name (e.g. `getUserRoleForEmail` → `src/utils/getUserRoleForEmail.ts`); the unit test shares that name.
- **Skills**: project AI skills live in `.agents/skills/` (usable by any AI agent) — `bruno-collection-generator`, `node`, `code-review`, `grill-me` (+ deps `grilling`, `setup-matt-pocock-skills`).
- **Architecture**: Express 5; Mongoose models; Zod schemas validated by `validateRequest` (attaches `validatedBody` / `validatedQuery` / `validatedParams`); `asyncHandler` wraps handlers; handlers throw `AppError` subclasses caught by `errorHandler`.
- **Auth**: JWT access token (15 min) returned in the body; refresh token in an `httpOnly`, `sameSite: lax` cookie at path `/auth/refresh`. Roles: emails ending in `@emary.dev` get `admin`, otherwise `user`.
- **Responses**: every endpoint uses the JSend envelope (`success` / `fail` / `error`) — see README "Response Format".
- **CORS**: public API — `origin: true, credentials: true` in `app.ts`.
- **Biome**: `pnpm lint` is expected to report exactly **6 `any` warnings** (intentional, in `src/types.d.ts`, `src/middleware/validate.ts`, and `tests/integration/helpers/api.ts`). Do not "fix" them.
- **tsup**: builds a single ESM bundle; `dependencies` stay external (notably `argon2`, which is a native module that can't be bundled).
