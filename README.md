# Team Theory — Take-Home: Build the Second Brain

Welcome, and thanks for making the time. This is a **build challenge**: you get a product spec, a document corpus, empty infrastructure, and product context — and you build the product. There is no starter app. How you build it is the point.

## Why this exercise

Team Theory builds AI products for private-equity talent teams — software that turns the scattered record of how a fund hires and manages leaders into memory, judgment, and defensible decisions. We're hiring someone who can **build full-stack AI products end to end**: pipeline to prompt to pixel, with real product taste. This exercise is a small, honest sample of that job.

## What you're building

A working slice of **the Second Brain** for a fictional PE fund, DAW Capital. The full spec is in **[SPEC.md](SPEC.md)** — the short version:

1. **Ingest** — a file pipeline that takes the fund's documents (`data/`) into a searchable knowledge base.
2. **Converse** — a chat where a user asks questions and gets **grounded answers with citations**.
3. **Generate** — from chat, a **portco brief** for Dana (from `templates/portco-brief.md`), grounded in the knowledge base, with trust chrome — saved as a **generated** document, not mixed with uploads.
4. **Dashboard** — a surface that makes the system legible at a glance.

The spec is deliberate about **what**; schema and UX are yours. **[STACK.md](STACK.md)** lists the technology families and the libraries we locked (Fastify + Prisma, Vite React SPA, Anthropic official SDK, local `@xenova/transformers` — **no LangChain / LangGraph**, **no Hono**, **no Next/SSR**) plus the empty backing services; **[ARCHITECTURE.md](ARCHITECTURE.md)** is the intended process map (SPA, API, ingest worker, queue, MinIO, pgvector); **[REPO_ARCHITECTURE.md](REPO_ARCHITECTURE.md)** is the intended code layout (`apps/frontend` + `apps/backend`); **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** is the draft data model; **[API_SPECS.md](API_SPECS.md)** is the HTTP/SSE contract for the Fastify API and the ingest worker; **[DESIGN.md](DESIGN.md)** gives light brand guidance. Inside those rails, build it your way.

## Before you build: understand the customer

**[context-brain/](context-brain/)** is a small knowledge folder about us — the company and mission, the product, who buys it, who uses it, and how a fund actually runs a search and a talent review. It exists so you can build for a real user instead of guessing.

**Interrogate it like a product manager would.** What decision does this document support? Who reads it? What would make them trust it? Ask it questions through your AI tools, or read it directly. And ask **us** questions too — reply to your invite email any time; we're your product owner and we answer fast.

Be aware: **the questions you ask — of the brain, of us — are part of what we read.** An engineer who interrogates the problem before building is exactly who we're looking for. Charging straight into code (or straight into "Claude, build the thing") without understanding who it's for is the failure mode this exercise is designed to surface.

## Quick start

You need Docker Desktop (or compatible) and ~4GB free. An **Anthropic API key** is required once chat/generate is implemented, but the development stack starts without one.

```bash
git clone <your repo>
cd tt-challenges
cp .env.example .env     # paste your Anthropic key
make up                  # builds and starts the complete development stack
```

That starts the React readiness page (`http://localhost:5173`), Fastify health endpoint (`http://localhost:3000/health`), API docs (`http://localhost:3000/api-docs.html`), idle ingest worker, Postgres+pgvector, MinIO, and ElasticMQ. Source is bind-mounted for hot reload.

The scaffold deliberately has no product features yet. Postgres has no app schema, and MinIO/ElasticMQ have no bucket or queue. Those are created with the feature implementation.

Useful commands:

```bash
make ps
make logs              # or: make logs SVC=api
make build
make typecheck
make lint
make test              # backend bootstrap tests
make down
make reset             # wipe volumes, then start again
```

## Timebox — 2 to 3 hours

We mean it. A rough shape that works:

- **~20–30 min** — read SPEC.md, interrogate `context-brain/`, ask us anything, decide your use case and your cuts.
- **~1.5–2 hrs** — build the slice.
- **~15–20 min** — wrap: [DECISIONS.md](DECISIONS.md), [PROMPTS.md](PROMPTS.md), a final `make up`-from-clean check, push.

You will not build all four pillars *well* in that time — nobody can. **A thin slice that runs end to end beats two pillars gold-plated**, and what you choose to cut (recorded in DECISIONS.md) is graded as a product decision, not a shortfall. Don't gold-plate; stop at the timebox.

## Use your AI tools — and drive them

Build with whatever you'd actually use — Claude Code, Cursor, anything. We *want* to see AI-native building; it's how we work. Two things matter:

- **Keep the trail.** [PROMPTS.md](PROMPTS.md) holds the exchanges that mattered, and `prompts/` holds your **raw session exports** — we treat the raw log as the source of truth. We read both closely, and we'll dig into them in the review.
- **You own every line.** AI output you didn't verify, understand, or would not defend in review is the single failure mode we screen hardest for. The tool is leverage, not a subcontractor.
- **A word on authorship, since we're asking your agent to take notes:** we don't mind who *typed* DECISIONS.md — we care that the thinking is yours, and the review is where we check. We'll probe your recorded decisions live, ask for the counterfactuals, and cross-reference quotes against your raw transcript. That's why honesty is the winning strategy here: a messy, real trail defends itself; a polished, generated one collapses under one follow-up question.

## How we evaluate

We read your submission the way we'd read a founding engineer's first week:

1. **Does the slice work?** Clean clone → `make up` → your documented steps → ingest, converse, generate, save. We will run it.
2. **Full-stack judgment.** Sensible schema, a pipeline that handles failure, grounding that doesn't lie, a front end that holds together. How the multi-service pieces connect.
3. **Product taste.** The use case you chose and why, what earned the screen, whether the output would actually be trusted by the person it's for. This is where `context-brain/` pays off.
4. **The questions you asked.** Of us, of the brain, in your prompts — did you interrogate the problem like an owner?
5. **Decisions & honesty.** DECISIONS.md tells a coherent story: what you cut, why, and what you'd do next. Claimed-but-broken costs more than cut-and-said-so.
6. **How you drove the AI.** PROMPTS.md + commit history read as one story of delegation, verification, and override.
7. **How far you took it.** The spec is the floor, not the ceiling. The strongest submissions add something we never asked for, because the builder saw it mattered: a small design system or component library instead of default styling; a data model rethought from first principles rather than the obvious tables; an extra feature you can argue drives the business case; research beyond this repo on the ICP or the market that visibly shaped your calls. To be clear about the tension with "don't gold-plate": gold-plating is polishing what was asked for; taste is adding the unasked-for thing that matters. One of these done with intent beats all of them done thin, and none of them excuse a broken core slice.

No hidden tricks, no planted bugs, no points for suffering.

## How you finish — definition of done

You're done when your slice runs end to end, or the timebox is up — whichever comes first. Then:

1. Make sure a **clean clone + `make up` + your README-documented steps** brings your product up. (Add your run instructions to the top of DECISIONS.md or a `RUNNING.md`.)
2. **Commit and push everything** — code, `DECISIONS.md`, `PROMPTS.md`.
3. **Reply to your invite email** with the repo link, and **book the 60-minute review** (link in the same email).

**The review (60 min):** you demo what you built and walk us through the decisions; then we'll ask for one small live change to *your* codebase, together on your machine. Nothing to prepare beyond having it able to start.

---

*Everything here — the fund, the companies, the people, the documents — is fictional. No real client data. Have fun with it; we're looking forward to seeing what you build.*
