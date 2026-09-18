# Active context

## Current focus

- Target topology in `ARCHITECTURE.md`. Schema **draft** in `DATABASE_SCHEMA.md`. **Locked:** one `documents` table, `source` uploaded|generated. **Open:** orgs table vs enum; citation FKs vs jsonb. No Prisma until those. Still **no app processes**.

## Recent decisions

- 2026-09-18: Use Cursor for the challenge. Added `.cursor/hooks.json` (stop/sessionEnd → `scripts/export-transcript.sh`), `.cursor/rules/challenge-orientation.mdc` (`alwaysApply`, mirrors `CLAUDE.md`). Kept `.claude/settings.json`.
- 2026-09-18: `export-transcript.sh` accepts Cursor `conversation_id` as session id fallback.
- 2026-09-18: `/refresh-memory` init — `AGENTS.md` operational front page; depth in `.cursor/memory/`. Existing fact preserved: follow `CLAUDE.md` and keep it in sync with the Cursor rule.
- 2026-09-18: Auto `PROMPTS.md` index (`scripts/index-prompts.py` on stop) + `challenge-build-log.mdc` reminder bullets in `DECISIONS.md`. Candidate still types **In your own words** and **Did with it**.
- 2026-09-18: Pillar 4 — Sam’s morning dashboard (**S**). Needs-me + pipeline/KB + generated list.
- 2026-09-18: `STACK.md` aligned to SPEC — Fastify (not Hono), Prisma, Vite CSR kit, Anthropic official SDK, no LangChain/LangGraph, `@xenova/transformers` ingest + retrieve. `/api-docs.html`.

## Open questions (candidate — not agent-filled)

- Data model (checkpoint 3): `documents.source` locked. Confirm `organizations` table vs enum; `generated_citations` → chunks vs jsonb.
- App run steps beyond `make up`.

## Known issues

- Backing services start empty; product does not run until candidate builds it.
- `DECISIONS.md` still has empty reminder blocks; `PROMPTS.md` auto-index fills from `prompts/`.
- Transcript hook needs trusted workspace / Hooks enabled in Cursor.
- No tests or CI.
