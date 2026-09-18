# DECISIONS — your build log

Keep this as you go, not from memory at the end. Alongside your code and [PROMPTS.md](PROMPTS.md), it's the main thing we read. Short and honest beats polished.

> If you're building with an AI agent, it's been asked ([CLAUDE.md](CLAUDE.md)) to pause at key decision points and put the call to **you** — use case, cuts, data model, pipeline shape, grounding, the trust surface. It records your answers **verbatim**; the _"in your own words"_ lines below are for **your keyboard only** — your agent has been told not to write them. To be straight about why: we don't mind who typed this file, but the thinking has to be yours, and the review is where we check — we'll probe these decisions live and cross-reference the quotes against your raw session transcript. A messy honest log beats a polished generated one, every time.

## How to run what I built

Exact steps from a clean clone. We follow these literally.

```
cp .env.example .env
make up

# Development endpoints
# Frontend:    http://localhost:5173
# API health:  http://localhost:3000/health
# API docs:    http://localhost:3000/api-docs.html
# MinIO:       http://localhost:9001

# Verification
make build
make typecheck
make lint
make test
```

<!-- agent-reminders:run -->

- 2026-09-18 — _backend boot:_ `cp .env.example .env && make up` deploys the Prisma migration, seeds organizations, creates the `documents` bucket and `ingest` queue, then starts the API and worker.
- 2026-09-18 — _final pass:_ clean reset, run steps, and build log confirmed. "Yes — the log and run steps are accurate (Recommended)".

<!-- /agent-reminders:run -->

## The use case I chose

I chose to generate a porcto brief for Dana (Managing Partner, IC chair).
Indeed, Dana won't really use the app, but she is the one that needs a document generated. She need a read she can trust and read in about 10 minutes before going in the Investment Committee (IC).
She mostely needs answers to this kind of question 'Does this leadership team still support the thesis, and do we intervene?' which is more a question about a unit/team, not about one person. That's why the "porcto brief" is the perfect document to generate for her.

The best, in my opinion, seems to create a template for this "porcto brief". Since she need to read it really fast, if the document is always organised the same way, it will be faster for her to read it and find the information she is looking for.

## Decisions & trade-offs

One block per significant decision (the checkpoint ones at minimum — use case, cuts, data model, pipeline shape, grounding, trust surface):

```
### Decision: …
- **The call:** what you chose
- **Said at the time:** "…" (verbatim, captured by your agent from the conversation)
- **What I gave up:** the trade-off
- **In your own words (typed by you, not your agent):** why this was right
```

### Decision: ingest formats + provenance UX (checkpoint 2 / 3)

- **The call:** Markdown only (enforced BE + FE). Org is first-class: seeds take org from path; uploads pick fund / PC1 / PC2 / PC3 in an Add-file modal. Isolation as provenance on the document, not full ACL.
- **Said at the time:** "Only \".md\" files are supported for now! Check in Both BE and FE about that." / "a button \"add file\" to open a modal with a file input/dropzone + a dropdown menu to select the organisation of the file right (fund / PC1, PC2, PC3)" / "Documents belong to an org (fund vs. each portco). Keep the provenance; our customers' #1 gate is data."
- **What I gave up:** Office parsers; inferring org from filename; hiding org from the uploader.
- **In your own words (typed by you, not your agent):**

### Decision: pipeline shape (checkpoint 4)

- **The call:** Async queue. **MinIO object + `documents` row** for uploads and seeds (seeds are not “read from disk forever”). Worker: extract text → chunk → embed → insert chunks. **Ingest Seeds** for `data/`. Failed doc: visible error + Retry. No DLQ.
- **Said at the time:** "uploaded files (and seeds when we trigger seeds ingestions) should end up in a minio bucket + a line in document table" / "Ingestion is **asynchronous** behind a queue" / "we don't need a DQL for now" / "a retry button" / "a button \"Ingest Seeds\""
- **What I gave up:** Dead-letter queue; auto-ingest on boot with no UI; Office ingest.
- **In your own words (typed by you, not your agent):**

### Decision: embeddings

- **The call:** Local `@xenova/transformers` for ingest **and** query-time retrieve; vectors in pgvector. Not Voyage/OpenAI.
- **Said at the time:** "ok yes let's use @xenova/transformers for embedding"
- **What I gave up:** Hosted embedding quality / a second API key; Anthropic has no embeddings API.
- **In your own words (typed by you, not your agent):**

### Decision: converse + grounding (checkpoint 5, partial)

- **The call:** Grounded cited chat; refuse when KB is silent. Multi-turn to Anthropic. Stream Anthropic SSE → API → frontend. Query embed with `@xenova/transformers`. Retrieval **B:** PC1/PC2/PC3 optional; **fund always included and shown in UI**; none selected = **fund only**. No cross-portco.
- **Said at the time:** "B — PC1/PC2/PC3 + always include fund: UI should make it clear that fund is always included. And if none of PC1,PC2,andPC3 is selected it will be only Fund so" / "in this pillar we will also use @xenova/transformers for retrieving ofc"
- **What I gave up:** Exclusive Fund\|PC dropdown; searching all portcos at once; a second embedding API at query time.
- **In your own words (typed by you, not your agent):**

### Decision: Claude Design contract (retrieve + API/schema)

- **The call:** Bind `API_SPECS.md` and `DATABASE_SCHEMA.md` to the Claude Design prototype. Chat retrieve = fund ∪ 0–3 portcos (fund-side user). Generate still one portco ∪ fund. Adopt all prototype additions: citation `marker`, chunk `heading` + neighbor context, documents `q`, `sizeBytes`/`chunkCount`, batch `POST /documents/retry`.
- **Said at the time:** "Yes — fund-side users need cross-portfolio questions (Recommended)" / "Adopt all additions from API_SPECS_V2 (Recommended)" / "do so"
- **What I gave up:** The earlier “never two portcos” chat arity; a smaller API that could not drive the prototype screens.
- **In your own words (typed by you, not your agent):**

### Decision: converse API (STACK AI layer)

- **The call:** **H** — official Anthropic SDK. Retrieve → `messages.stream`. No LangChain/LangGraph. HTTP is **Fastify** (Hono reversed — see app libraries).
- **Said at the time:** "yes I agree, fo with H"
- **What I gave up:** LangGraph nodes/checkpoints; LangChain stream helpers. Less framework, more explicit grounding prompt.
- **In your own words (typed by you, not your agent):**

### Decision: app libraries (HTTP + FE kit)

- **The call:** Backend TypeScript **Fastify** (not Hono), zod, Prisma, axios, basic prettier + eslint, generated API docs at **`/api-docs.html`**. Frontend TypeScript React **CSR** (Vite, no Next/SSR): zod, react-hook-form, shadcn + Radix, TanStack Query, TanStack Table if needed, axios, basic prettier, Tailwind, lodash, lucide-react, react-router-dom.
- **Said at the time:** "now for the backend, I also want to use: typescript, fastify (not Hono), zod, prisma, axios, basic config of prettier and eslint, generate an api doc at the url /api-docs.html" / "in the frontend, I want to use typescript, react, zod, react hook form, Shadcn and radix UI, TanStack Query, Tanstack Table (if needed), axios, basic config of prettier, tailwind CSS, lodash, lucide-react, react-router-dom (Everything client side rendering!)"
- **What I gave up:** Hono; Next/SSR; a second HTTP/ORM stack.
- **In your own words (typed by you, not your agent):**

### Decision: generate format + template (checkpoint 6)

- **The call:** Portco brief as **markdown** from a **fixed template** (`templates/portco-brief.md`) so Dana always finds the same sections. Headings always present; gaps stated. Render as a memo, not chat.
- **Said at the time:** "right" (to a checked-in section template) / "It should generate a portco brief think for Dana! From a template .md"
- **What I gave up:** Freeform LLM essays; PDF/Word; a different shape per run.
- **In your own words (typed by you, not your agent):**

### Decision: uploaded vs generated (data model)

- **The call:** One `documents` table with `source` = `uploaded` \| `generated`. Frontend still lists them separately. Not two tables.
- **Said at the time:** "We sould dissociated clearly documents uploaded and documents generated (in both database and frontend)" / "I don't want \"documents\" and \"generated_documents\" to be in 2 different tables, I want only one \"documents\" table with a type/source uploaded/generated"
- **What I gave up:** A separate `generated_documents` table; one undifferentiated UI list.
- **In your own words (typed by you, not your agent):**

### Decision: trust surface (checkpoint 6)

- **The call:** Brief ships with citations per claim, metadata (who/what/when/from-which-sources), flags/alerts (e.g. only one independent reference), suggested next steps.
- **Said at the time:** "The document ships with **artifacts that make it trustworthy and useful** — evidence/citations per claim, metadata (who/what/when/from-which-sources), flags or alerts (\"only one independent reference behind this section\"), suggested next steps."
- **What I gave up:** A pretty memo with no interrogation path.
- **In your own words (typed by you, not your agent):**

### Decision: LLM prompts in git (versioned)

- **The call:** Chat and generate **system prompts live in the repo with versions** (not a prompt CMS). **Not** in `prompts/` — that folder is challenge session transcripts. Path: `llm-prompts/v1/`. Document template stays `templates/portco-brief.md`.
- **Said at the time:** "For Pillar 3 and Pillar 2, we need prompt as weel to pass to Anthropic right? Let's store it in the codebase for now with versioning."
- **What I gave up:** Prompts only in code strings; a hosted prompt store.
- **In your own words (typed by you, not your agent):**

### Decision: stream answer tokens, cite after

- **The call:** FE → API → Anthropic; SSE back API → FE; **typing effect** from token deltas. Citations as a **closing event / end of turn**, not a citation object on every token.
- **Said at the time:** "FE make API call to BE and BE make API call to Anthropic" / "Anthropic stream the respone via SSE to API that stream the response to FE via SSE." / "in the frontend we would need a nice typing effect to write response nicely when streaming"
- **What I gave up:** Waiting for the full JSON blob before any text; per-token structured citations.
- **In your own words (typed by you, not your agent):**

### Decision: dashboard reader (Pillar 4)

- **The call:** **S** — Sam’s morning board (needs-me + pipeline + generated list). Hema glances; Dana does not log in.
- **Said at the time:** "S"
- **What I gave up:** Hema-only briefing queue; a partner command center; vanity counters.
- **In your own words (typed by you, not your agent):**

### Decision: repo layout

- **The call:** Git monorepo with `apps/backend` (Fastify `src/api` + ingest `src/worker` + `src/common` + `test/`) and `apps/frontend` (Vite SPA). No Turbo/Nx; no extra `packages/*`. Anthropic prompts stay in `llm-prompts/v1/`, not `apps/backend/src/prompts/`. Detail: `REPO_ARCHITECTURE.md`.
- **Said at the time:** "I was thinking something like that." / `apps/backend/` `src/` `api/` `worker/` `common/` `schemas/` `database/` `helpers/` `services/` `prompts/` / `apps/frontend/` `src/` `components/` `constants/` `hooks/` `data/` `ui/` `pages/` `schemas/` `helpers/` / "an important part is missing in the backend architecture, the /test folder."
- **What I gave up:** Separate `apps/api` + `apps/worker` packages; a shared `packages/` workspace on day one; colocating `*.test.ts` under `src/`.
- **In your own words (typed by you, not your agent):**

### Decision: bootstrap runtime

- **The call:** Root npm workspaces; Docker Compose runs frontend, API, idle worker, and all backing services. `make up` is the only startup command. Bootstrap does not create the Prisma schema, MinIO bucket, ElasticMQ queue, or product features.
- **Said at the time:** "Root npm workspaces for frontend/backend (Recommended)" / "Start apps + backing services; API/worker health checks only (Recommended)"
- **What I gave up:** Separate npm installs and application resource initialization during bootstrap.
- **In your own words (typed by you, not your agent):**

<!-- agent-reminders:decisions -->

- 2026-09-18 — _use case:_ portco brief for Dana (~10 min, IC/board). "ok let's go with \"portco brief\"".
- 2026-09-18 — _trust surface (Dana):_ template + citations/metadata/flags/next steps. Not Sam’s scratch draft.
- 2026-09-18 — _ingest formats:_ markdown only, BE+FE. "Only \".md\" files are supported for now! Check in Both BE and FE about that."
- 2026-09-18 — _pipeline:_ MinIO + `documents` row (uploads and seeds), then queue; extract → chunk → embed → insert; Retry not DLQ. "uploaded files (and seeds when we trigger seeds ingestions) should end up in a minio bucket + a line in document table"
- 2026-09-18 — _embeddings:_ local `@xenova/transformers` for ingest **and** chat retrieve. "ok yes let's use @xenova/transformers for embedding" / "we will also use @xenova/transformers for retrieving ofc"
- 2026-09-18 — _converse:_ grounded + citations; never invent; multi-turn to Anthropic; SSE API→FE. "YES, we should keep the context and send it to Anthropic."
- 2026-09-18 — _retrieval scope:_ chat = fund ∪ 0–3 portcos (fund-side). Generate still one portco ∪ fund. "Yes — fund-side users need cross-portfolio questions (Recommended)" / "do so"
- 2026-09-18 — _HTTP + worker contract:_ `API_SPECS.md` matches Claude Design — markers, batch retry, `q`, `sizeBytes`/`chunkCount`, chunk neighbors/`heading`, `portcoOrganizationIds`. "Adopt all additions from API_SPECS_V2 (Recommended)" / "do so"
- 2026-09-18 — _data model locked:_ `organizations`; one `documents` table; `generated_citations.chunk_id` FK to `chunks`; `source_document_ids uuid[]`; `vector(384)`. "Confirm — I’ll write my reasoning in Other (Recommended)".
- 2026-09-18 — _AI layer:_ H — Anthropic SDK only, no LangChain/LangGraph. "yes I agree, fo with H"
- 2026-09-18 — _stack rails:_ Fastify (not Hono) + Prisma + zod; Vite React CSR (shadcn/Radix, RHF, TanStack Query, axios, Tailwind, react-router-dom); `/api-docs.html`. Anthropic SDK + `@xenova/transformers`. "fastify (not Hono)" / "Everything client side rendering!"
- 2026-09-18 — _generate format:_ markdown from `templates/portco-brief.md` for Dana. "It should generate a portco brief think for Dana! From a template .md"
- 2026-09-18 — _uploaded vs generated:_ one `documents` table, `source` uploaded\|generated; UI still split. "I don't want \"documents\" and \"generated_documents\" to be in 2 different tables, I want only one \"documents\" table with a type/source uploaded/generated"
- 2026-09-18 — _trust surface:_ citations, metadata, flags, next steps. "evidence/citations per claim, metadata (who/what/when/from-which-sources), flags or alerts"
- 2026-09-18 — _LLM prompts:_ versioned in repo (`llm-prompts/v2/chat.md` for markers; generate still `v1/portco-brief.md`), not in `prompts/` transcripts. "Let's store it in the codebase for now with versioning."
- 2026-09-18 — _stream UX:_ Anthropic SSE → API → FE typing effect; citations at end of turn. "nice typing effect to write response nicely when streaming"
- 2026-09-18 — _dashboard:_ Sam’s morning (**S**). "S"
- 2026-09-18 — _process topology:_ React FE + Fastify API + ingest **worker** behind ElasticMQ + pgvector + MinIO. Documented in `ARCHITECTURE.md`. "We will have a FE in React, an API, a worker for document ingestion behind an ElasticMQ, a pgvector, a minio."
- 2026-09-18 — _repo layout:_ one git monorepo; `apps/backend` (`api` + `worker` + `common`) and `apps/frontend`; LLM prompts stay in `llm-prompts/v1/`, not `src/prompts/`. Documented in `REPO_ARCHITECTURE.md`. "apps/backend/ src/ api/ worker/ common/ schemas/ database/ helpers/ services/ prompts/" / "apps/frontend/ src/ components/ constants/ hooks/ data/ ui/ pages/ schemas/ helpers/"
- 2026-09-18 — _backend tests:_ `apps/backend/test/` sibling of `src/` (`api` / `worker` / `common`). "an important part is missing in the backend architecture, the /test folder."
- 2026-09-18 — _backend runtime:_ API boot owns the MinIO bucket/queue; API and worker deploy the Prisma migration before starting. `make up` remains the entry point.

<!-- /agent-reminders:decisions -->

## What I cut

The parts of [SPEC.md](SPEC.md) you deliberately didn't build, and why those were the right cuts for a 2–3 hour slice. Cuts recorded here are graded as product decisions; things silently missing are graded as gaps.

<!-- agent-reminders:cuts -->

- 2026-09-18 — _ingest:_ no Office parsers; no DLQ; no ACL enforcement. ".md" only. Retry instead of DLQ ("we don't need a DQL for now").
- 2026-09-18 — _dashboard:_ no Hema-only queue, no heatmap, no vanity totals. Primary is Sam (**S**).

<!-- /agent-reminders:cuts -->

## If I had another day

Two or three sentences: what you'd build next, harden, or test — and the first thing you'd ship.

<!-- agent-reminders:another-day -->

- 2026-09-18 — _ingest next:_ Office parsers, DLQ, org-scoped enforcement — cut for now.
- 2026-09-18 — _AI next:_ LangGraph if generate grows real branches — not for chat.

<!-- /agent-reminders:another-day -->
