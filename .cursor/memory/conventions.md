# Conventions

## Challenge process (agents)

Stop before implementing and ask the candidate (options + trade-offs). Record **their words in quotation marks** in `DECISIONS.md`. `"you decide"` is an answer to quote, not a skip. Probe thin “just do standard” once (“standard for whom? your reader is a PE partner”), then respect the call.

| # | When | Question |
|---|------|----------|
| 1 | Before any product code | Which generated document? Who reads it? What are they deciding? Push `context-brain/` |
| 2 | Right after | What are you cutting from four pillars, and why? |
| 3 | Before first migration | Documents, chunks, artifacts; where fund vs portco provenance lives |
| 4 | Before wiring ingest | Async vs inline; failure UX |
| 5 | Before agent code | Retrieval, citations on claims, corpus-silent behavior |
| 6 | Before generate UX | Metadata, flags, evidence, confidence — trust surface for checkpoint-1 reader |
| 7 | Before done | DECISIONS true story; clean `make up` + documented steps |

Do not invent, polish, or expand rationales. Never write **In your own words** (candidate keyboard only). Reviewers match quotes to `prompts/` transcripts.

## Code organization

- No starter `src/` — candidate invents layout. Prefer STACK families; production-shaped habits in `STACK.md`.
- Raw logs: `prompts/*.jsonl`. `PROMPTS.md` auto-index is rebuilt by `scripts/index-prompts.py` (stop hook). Candidate owns **Did with it**.
- Product calls: 1–2 reminder bullets in `DECISIONS.md` `<!-- agent-reminders:* -->` (see `.cursor/rules/challenge-build-log.mdc`). Never **In your own words**.

## Patterns

- Isolation: schema/org provenance, not scattered handler `if`s.
- Async failures visible in UI (status, dashboard), not logs only.
- Secrets: `.env` only; never commit keys.

## Testing

- None in repo. Reviewers run the documented path. Candidate may add tests; not required for the slice.

## Agent / Cursor wiring

- `CLAUDE.md` = challenge agent brief; `.cursor/rules/challenge-orientation.mdc` mirrors it — keep in sync.
- Transcript hooks: `.cursor/hooks.json` and `.claude/settings.json` → `scripts/export-transcript.sh` then `index-prompts.py`. Fail-open (exit 0).
- This `AGENTS.md` is operational front page; depth in `.cursor/memory/`.

## Do not

- Swap stack families or add non-Anthropic SaaS.
- Claim facts without citations; invent corpus content.
- Assume an existing app, schema, or queues.
- Gold-plate one pillar while skipping others’ *must*.
- Fill DECISIONS “In your own words” or paraphrase checkpoint answers.
