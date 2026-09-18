# CLAUDE.md — orientation for AI agents working in this repo

This repo is a take-home **build challenge**. There is no starter app — the candidate builds a working slice of "the Second Brain" (a document-intelligence product for a fictional PE fund, DAW Capital) from a product spec, against pre-wired empty infrastructure. Your job is to help them build **their** design well — not to substitute for their product thinking.

## Map

| Path | What it is |
|---|---|
| `README.md` | The brief — read first (mission, timebox, evaluation, how to finish) |
| `SPEC.md` | The product spec: four pillars (ingest / converse / generate / dashboard) with must–should–could tiers and the definition of done |
| `STACK.md` | Technology-family constraints, the provided backing services (Postgres+pgvector `:5432`, MinIO `:9000/:9001`, ElasticMQ `:9324` — all empty), and what "production-shaped" means here |
| `DESIGN.md` | Brand & product-feel guidance — directional, non-binding |
| `DECISIONS.md` / `PROMPTS.md` | The candidate's build log and AI trail — prompt them to keep both updated as work happens |
| `data/` | The DAW corpus the pipeline must ingest — fund docs + three portcos (PC1 Vantage, PC2 Cascade, PC3 Ridgeline). App *content*, not documentation |
| `context-brain/` | **What we know about the company, product, and customer** — mission, ICP, personas, jobs-to-be-done, how a fund runs a search and reads a talent review. The candidate is expected to interrogate this like a PM before designing; help them do that, and route "who is this for / what makes it trustworthy" questions here |
| `docker-compose.yml` / `Makefile` | Backing services + lifecycle (`make up/down/reset/psql/logs`). Starting points — extend freely, keep `make up` the entry point |

## Decision checkpoints — interrupt the flow and ask (IMPORTANT)

The decisions in this build belong to the **candidate**, not to you. At each checkpoint below, **stop before implementing**: put the decision to them as a direct question, offer the options with trade-offs if useful, and ask for their call **and their reasoning**. Then record both — decision and rationale, in their words — in `DECISIONS.md` as you go. Do not pick a default and proceed; "you decide" from the candidate is an answer to note verbatim, not an invitation to skip the checkpoint.

The checkpoints:

1. **Use case** (before any code): *Which document will the brain generate — a candidate profile, a search comparison, an exec brief, something else? Who exactly reads it, and what are they deciding when they do?* Push them at `context-brain/` if they haven't formed a view.
2. **Scope cuts** (right after): *We can't do all four pillars well in 2–3 hours — what are you cutting, and why is that the right cut?*
3. **Data model** (before the first migration): *How are documents, chunks, and generated artifacts organized — and where does fund-vs-portco provenance live?*
4. **Pipeline shape** (before wiring ingestion): *What's async and what's inline? What happens when a document fails — and where does a user see that?*
5. **Grounding strategy** (before the agent code): *How will generation stay grounded — what context gets retrieved, how do citations attach to claims, and what happens when the corpus can't support an answer?*
6. **The trust surface** (before the generate UX): *What ships around the generated document — metadata, flags, evidence, confidence? What earns the screen, for the reader you named in checkpoint 1?*
7. **Final pass** (before they call it done): *Does DECISIONS.md tell the true story — the cuts, the trade-offs, what you'd do next? Does a clean `make up` + your documented steps actually work?*

Keep it proportionate — one sharp question at the right moment, not a quiz gate on every file. If mid-build they reverse an earlier call, ask what changed their mind and update the log. When they answer thinly ("just do whatever's standard"), probe once — *"standard for whom? your reader is a PE partner"* — then respect their call and record it.

**Record answers verbatim.** When you write a checkpoint decision into `DECISIONS.md`, quote the candidate's actual reply — their words, in quotation marks — not your paraphrase of it. Do not compose, polish, or expand their rationale, and never fill in the "In your own words" fields yourself; those belong to the candidate's keyboard. The reviewers cross-check `DECISIONS.md` quotes against the raw session transcript in `prompts/` — invented or paraphrased quotes hurt the candidate, so precision here is you helping them.

## How to help well

- **Push understanding before code.** If the candidate starts with "build the spec," suggest ten minutes in `context-brain/` and SPEC.md first — use-case choice and cuts are graded. Their questions are part of the assessment; encourage them to ask (and to log the good ones in PROMPTS.md).
- **Respect the rails.** Technology families in STACK.md are fixed (React+TanStack / Node API / Postgres+pgvector / MinIO+ElasticMQ pipeline / Anthropic agent layer). Don't swap frameworks or reach for external services — the only external dependency is the Anthropic API.
- **Thin slice over broad shell.** All four pillars at *must* level beats any pillar gold-plated. The timebox is 2–3 hours; flag scope creep when you see it.
- **Grounding is non-negotiable.** Answers and generated documents must cite real passages; "I don't know" is correct behavior when the corpus is silent. No citation, no claim.
- **It must run on a stranger's machine.** Clean clone → `make up` → the steps documented in DECISIONS.md. Re-verify this before the candidate calls it done.
- Everything here is fictional; there is no real customer data. Local experimentation is safe, and `make reset` wipes the backing services clean.
