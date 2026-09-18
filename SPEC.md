# SPEC — the Second Brain, thin slice

*What to build. Prescriptive on the product; schema and UX are yours. Technology families and locked libraries (Fastify, Prisma, Anthropic official SDK, `@xenova/transformers`, Vite SPA, no LangChain/LangGraph) live in [STACK.md](STACK.md). Read [context-brain/](context-brain/) before designing; it tells you who this is for and what they need to trust it.*

## The product in one paragraph

DAW Capital, a lower-middle-market PE fund, generates a constant stream of people-documents — board decks, 360s, leadership assessments, interview notes, scorecards — across three portfolio companies. Today that record is scattered files. The Second Brain ingests it, makes it conversational, and turns conversations into **new documents the fund keeps**: profiles, comparisons, briefs a partner could stand behind. Memory in, judgment out, memory back in.

## Pillar 1 — Ingest *(this slice)*

A file pipeline from raw documents to a searchable knowledge base. **Markdown only** (`.md`) on both API and UI. Office binaries under `data/portcos/*/inbox/office/` are out of parser scope.

**How it runs:** **Put object in MinIO + insert a `documents` row** (same for **Add file** and **Ingest Seeds**), then enqueue. Worker reads the object, **extracts text → chunks → embeds → inserts** chunks into Postgres+pgvector. Embeddings: **local `@xenova/transformers`** in the worker (no extra hosted API). Status **queued / processing / ready / failed** lives on that document row and is visible. A bad or unsupported file fails *that* document, not the pipeline.

**How a user starts work:** **Ingest Seeds** copies each `data/` markdown file into the bucket, creates a document row (org from path), enqueues. **Add file** does the same from the modal. Failed docs show a clear error and a **Retry** (re-enqueue; no DLQ).

| | This slice |
|---|---|
| **Must** | Ingest the markdown corpus in `data/` (fund + PC1–PC3) into a retrievable KB. Ingestion is **asynchronous behind a queue**. Per-document status **queued / processing / ready / failed** is **visible**. |
| **Must** | A bad file fails *that document*, visibly — not the pipeline. |
| **Must** | **`.md` only** — reject other types in the frontend and the API. |
| **Must** | Every ingest (upload **and** seeds) writes **MinIO object + a `documents` row** before/with the queue. Worker does not ingest from the git `data/` tree as the system of record. |
| **Should** | User can add a new `.md` in-product (modal: file + org) and watch it become available. **Ingest Seeds** starts the seed corpus. |
| **Should** | Documents belong to an org (fund vs each portco). Provenance lives on the document. Full ACL enforcement is still a *could*. |
| **Should (thin retry)** | Failed ingest: clear frontend error + **Retry**. No dead-letter queue. |
| **Cut** | Parsing `.docx` / `.xlsx` / `.pptx`. DLQ. Re-processing beyond Retry. Org-scoped access enforcement. |

## Pillar 2 — Converse *(this slice)*

Chat with the brain over what's been ingested. **Sam** (and Hema) ask; answers must be **defensible** — every claim traces to a real passage.

**How it runs:** Fastify API **hand-rolls the Anthropic SDK**. Load a **versioned system prompt from the repo** (not the challenge `prompts/` transcript folder). User question + **retrieval scope** + **prior turns** → embed query → pgvector → `messages.stream` with passages as the only evidence.

**Streaming (answer text):** FE → API → Anthropic; Anthropic **SSE → API SSE → FE**. Frontend **appends tokens** (typing). That *is* streaming. What we **cut** is attaching a structured citation object to *each token* as it arrives (the model does not emit stable cite JSON mid-word). Citations: **final SSE event** (or parse once the turn completes) so a reader can still open the source and find the line.

If retrieved context cannot support the answer, the model **says so** — no citation, no claim.

**Multi-turn:** send conversation history to Anthropic each turn (Pillar 3 is how documents get made). Retrieval still runs **per question** with the current scope — history is not a license to use another portco's docs.

**Retrieval scope:** control is **PC1 / PC2 / PC3** (optional; none or one). **Fund is always in the retrieve set** — the UI must say so (not a silent union). **No portco selected → fund only.** A selected portco → `that portco ∪ fund`. Never PC→PC.

| | This slice |
|---|---|
| **Must** | Chat UI: questions get answers **grounded in ingested docs**, with **citations to a real passage** (open the source, find the line). |
| **Must** | If the KB can't support it, say so. **Never invent.** |
| **Must** | Query embeddings: **same `@xenova/transformers` model** as ingest (not a second embedder). |
| **Must** | **Anthropic official SDK** in the API — retrieve then stream. **No LangChain / LangGraph** (simple RAG, not an agent graph). |
| **Should** | **Multi-turn:** keep context and **send it to Anthropic**. |
| **Should (was could)** | **Streaming answer tokens:** Anthropic SSE → API → FE; **typing effect** by appending deltas. Citations after the turn (or a closing SSE event), not per token. |
| **Should (filter)** | Portco optional (PC1/PC2/PC3). Fund **always included**, and **visible in the UI**. Empty portco = **fund only**. Scope in SQL, not prompt-only. |
| **Should (prompts)** | Chat **system prompt** versioned in-repo (e.g. `llm-prompts/v1/chat.md`). Do **not** put these in `prompts/` (that folder is session transcripts for reviewers). |
| **Cut** | Reranking. Exclusive Fund-as-fourth-portco dropdown. **Per-token citation payloads.** LangChain / LangGraph. |

## Pillar 3 — Generate *(this slice)*

From chat, Sam/Hema produce a **portco brief for Dana** (10-minute IC/board read: team vs value-creation plan). Grounded in the KB. **Not** a chat bubble — render as a memo from a **fixed `.md` template** (`templates/portco-brief.md`). Same headings every time; unsupported sections stay visible as gaps.

**Save:** MinIO + `documents` row, **kind distinct from uploads** (DB **and** UI). Uploaded/seeded vs generated must not look like one pile.

**Trust surface (Dana):** citations per claim (open the source, find the line); metadata who/what/when/from-which-sources; flags (e.g. only one independent reference); suggested next steps. Uncited prose ≠ cited.

| | This slice |
|---|---|
| **Must** | From chat, generate a **portco brief** grounded in the KB (Anthropic SDK, same retrieve rules as chat: selected portco ∪ fund). |
| **Must** | Persist it: MinIO + `documents` row, **listed as generated** — not mixed with uploads. Schema and frontend both split **uploaded vs generated**. |
| **Must** | Storage format **markdown**, filled from **`templates/portco-brief.md`**: Header; Team vs VCP; Working / yellow-red; Evidence; Flags; Suggested next steps. |
| **Must** | Generate **system prompt** versioned in-repo (e.g. `llm-prompts/v1/portco-brief.md`) plus the document template. Prompt ≠ template: prompt = grounding rules; template = Dana’s headings. |
| **Should** | Trust chrome: evidence/citations, metadata, flags/alerts, next steps. |
| **Cut** | Profile / comparison / single-exec brief. PDF/Word export. Re-ingest generated brief into the chat retriever (full loop) unless we add it later. |

## Pillar 4 — Dashboard *(this slice)*

**Primary user: Sam** (daily operator). Morning question: *what needs me, what’s new, is the pipeline honest?* Hema can glance (generated briefs exist); Dana never logs in.

One view — not vanity counters (“42 documents!”).

1. **Needs me** — failed (and stuck) ingest: error, **Retry**.  
2. **Pipeline / KB** — uploaded+seeded `.md` by org, status queued / processing / ready / failed. **Ingest Seeds** and **Add file** live here. Uploaded vs generated stay visually split.  
3. **Generated** — portco briefs as their own list; open the memo.

| | This slice |
|---|---|
| **Must** | One view: KB + pipeline + generated. Sam can see a failed doc without opening logs. |
| **Should** | Answers Sam’s morning: **needs me** (failed/stuck) and **what’s new** (ready + latest briefs). |
| **Cut** | Hema-only briefing queue; Dana login; talent-review heatmap; vanity totals. |

## Definition of done

A **thin slice, end to end**: corpus ingested → a grounded, cited conversation → one document generated and saved → visible on a dashboard. All four pillars touched at *must* level beats any pillar polished to *could*. Cuts are expected and graded as decisions — record them in [DECISIONS.md](DECISIONS.md).

We will run it: clean clone → `make up` → your documented steps. If it needs a hand-holding sequence, document the sequence; undocumented magic counts against, documented pragmatism counts for.

## Beyond the spec

This spec is the floor. Once the core slice works, the submissions that stand out take it somewhere we didn't ask for — a real component library or mini design system, a data model argued from first principles, one extra capability chosen because it drives the *business* case, market or ICP research that changed a decision. If you go there, say so in [DECISIONS.md](DECISIONS.md): what you added, why it mattered more than polishing, and what it cost you. Unasked-for judgment is a feature; unasked-for polish is not.
