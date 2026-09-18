# Active context

## Current focus

- Pre-build: Cursor wiring + project memory init. **No product code, no checkpoint answers.**
- Next product work: checkpoint 1 (use case / reader / decision) after `context-brain/` + SPEC — then cuts (checkpoint 2). Do not start schema/app until those calls are recorded.

## Recent decisions

- 2026-09-18: Use Cursor for the challenge. Added `.cursor/hooks.json` (stop/sessionEnd → `scripts/export-transcript.sh`), `.cursor/rules/challenge-orientation.mdc` (`alwaysApply`, mirrors `CLAUDE.md`). Kept `.claude/settings.json`.
- 2026-09-18: `export-transcript.sh` accepts Cursor `conversation_id` as session id fallback.
- 2026-09-18: `/refresh-memory` init — `AGENTS.md` operational front page; depth in `.cursor/memory/`. Existing fact preserved: follow `CLAUDE.md` and keep it in sync with the Cursor rule.
- 2026-09-18: Auto `PROMPTS.md` index (`scripts/index-prompts.py` on stop) + `challenge-build-log.mdc` reminder bullets in `DECISIONS.md`. Candidate still types **In your own words** and **Did with it**.

## Open questions (candidate — not agent-filled)

- Generated document type and reader (checkpoint 1).
- Scope cuts (2).
- Data model / provenance (3).
- Pipeline async + failure UX (4).
- Grounding/citations (5).
- Trust surface (6).
- App run steps beyond `make up` (DECISIONS “How to run” still `# then …`).

## Known issues

- Backing services start empty; product does not run until candidate builds it.
- `DECISIONS.md` still has empty reminder blocks; `PROMPTS.md` auto-index fills from `prompts/`.
- Transcript hook needs trusted workspace / Hooks enabled in Cursor.
- No tests or CI.
