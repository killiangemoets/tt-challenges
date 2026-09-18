# Active context

## Current focus

- Backend complete: Prisma/pgvector schema, MinIO/SQS initialization, every `API_SPECS.md` route, async Xenova ingest worker, scoped retrieval, Anthropic SSE chat/brief persistence, and backend tests. Schema locked: organization rows, one documents table, citation-to-chunk FKs, `uuid[]` source ids, vector(384).

## Recent decisions

- 2026-09-18: Use Cursor for the challenge. Added `.cursor/hooks.json` (stop/sessionEnd → `scripts/export-transcript.sh`), `.cursor/rules/challenge-orientation.mdc` (`alwaysApply`, mirrors `CLAUDE.md`). Kept `.claude/settings.json`.
- 2026-09-18: `export-transcript.sh` accepts Cursor `conversation_id` as session id fallback.
- 2026-09-18: `/refresh-memory` init — `AGENTS.md` operational front page; depth in `.cursor/memory/`. Existing fact preserved: follow `CLAUDE.md` and keep it in sync with the Cursor rule.
- 2026-09-18: Auto `PROMPTS.md` index (`scripts/index-prompts.py` on stop) + `challenge-build-log.mdc` reminder bullets in `DECISIONS.md`. Candidate still types **In your own words** and **Did with it**.
- 2026-09-18: Pillar 4 — Sam’s morning dashboard (**S**). Needs-me + pipeline/KB + generated list.
- 2026-09-18: `STACK.md` aligned to SPEC — Fastify (not Hono), Prisma, Vite CSR kit, Anthropic official SDK, no LangChain/LangGraph, `@xenova/transformers` ingest + retrieve. `/api-docs.html`.
- 2026-09-18: Repo layout documented in `REPO_ARCHITECTURE.md` (candidate tree: `apps/backend` + `apps/frontend`). Backend tests: `apps/backend/test/`.
- 2026-09-18: Bootstrap runtime uses root npm workspaces + Node 22 Docker images. `make up` starts six services with hot reload; typecheck/lint/build and 2 API bootstrap tests pass.
- 2026-09-18: Bound `API_SPECS.md` + `DATABASE_SCHEMA.md` to Claude Design: multi-portco chat retrieve; citation markers; batch retry; `q`; `sizeBytes`/`chunkCount`; chunk heading/neighbors. Candidate: "do so".

## Open questions (candidate — not agent-filled)

- Repeat the Anthropic chat/brief smoke path once an API key is configured.

## Known issues

- Chat and brief runtime smoke verification requires `ANTHROPIC_API_KEY`; missing key correctly returns `503 failed_dependency`.
- `DECISIONS.md` still has empty reminder blocks; `PROMPTS.md` auto-index fills from `prompts/`.
- Transcript hook needs trusted workspace / Hooks enabled in Cursor.
- Backend unit suite covers route contracts, service isolation, chunking, and worker state/failure paths; no frontend tests or CI.
- `npm audit --omit=dev`: current required `@xenova/transformers` line carries transitive protobufjs/sharp advisories; do not force-downgrade it without validating the required embedding stack.
