# SPEC — the Second Brain, thin slice

*What to build. Prescriptive on the product, silent on the implementation — architecture, schema, agent wiring, and UX are yours. Read [context-brain/](context-brain/) before designing; it tells you who this is for and what they need to trust it.*

## The product in one paragraph

DAW Capital, a lower-middle-market PE fund, generates a constant stream of people-documents — board decks, 360s, leadership assessments, interview notes, scorecards — across three portfolio companies. Today that record is scattered files. The Second Brain ingests it, makes it conversational, and turns conversations into **new documents the fund keeps**: profiles, comparisons, briefs a partner could stand behind. Memory in, judgment out, memory back in.

## Pillar 1 — Ingest

A file pipeline from raw documents to a searchable knowledge base.

| | Requirement |
|---|---|
| **Must** | Ingest the markdown corpus in `data/` (fund docs + three portcos) into a knowledge base that supports retrieval. Ingestion is **asynchronous** — the queue is there for a reason — and each document's status (queued / processing / ready / failed) is **visible to the user**. |
| **Must** | A bad file fails *that document*, visibly — not the pipeline. |
| **Should** | A user can add a new document through the product (not just the seed corpus) and watch it become available. |
| **Should** | Documents belong to an org (fund vs. each portco). Keep the provenance; our customers' #1 gate is data isolation, and your data model should show you thought about it (enforcing it fully is a *could*). |
| **Could** | Re-processing, dead-letter handling, org-scoped access enforcement. |

## Pillar 2 — Converse

Chat with the brain over what's been ingested.

| | Requirement |
|---|---|
| **Must** | A chat interface where the user asks questions and gets answers **grounded in the ingested documents**, with **citations that trace to a real passage** — a reader can open the source and find the line. |
| **Must** | When the knowledge base doesn't contain the answer, the brain says so. It never invents. |
| **Should** | Multi-turn: the conversation carries context, because the conversation is how documents get *made* (Pillar 3). |
| **Could** | Streaming responses; retrieval quality beyond the basics (reranking, filters). |

## Pillar 3 — Generate *(the heart of the exercise)*

Through conversation, the brain produces a document — and the fund keeps it.

| | Requirement |
|---|---|
| **Must** | From the chat, the user can have the brain **generate a document** grounded in the knowledge base. Pick a use case the customer would love — a **candidate profile** assembled from interviews/references, a **comparison of candidates in a search**, an **exec or portco brief** — one is enough; `context-brain/` will tell you which is worth building. |
| **Must** | The generated document is **saved back into the knowledge base** — persisted, listed among the fund's documents, part of the record. |
| **Should** | The document ships with **artifacts that make it trustworthy and useful** — evidence/citations per claim, metadata (who/what/when/from-which-sources), flags or alerts ("only one independent reference behind this section"), suggested next steps. What earns the screen is your product call. |
| **Could** | The saved document is itself re-ingested — the brain can retrieve and cite it in later conversations. Full loop. |

## Pillar 4 — Dashboard

A surface that makes the system legible at a glance. Deliberately the loosest pillar — it's the pure product-taste read.

| | Requirement |
|---|---|
| **Must** | One view that shows the state of the world: what's in the knowledge base, what the pipeline is doing, what's been generated. |
| **Should** | It answers a real user's morning question (*"what's new, what needs me?"*) — not a wall of internals. |
| **Could** | Whatever a talent partner would actually want. Surprise us. |

## Definition of done

A **thin slice, end to end**: corpus ingested → a grounded, cited conversation → one document generated and saved → visible on a dashboard. All four pillars touched at *must* level beats any pillar polished to *could*. Cuts are expected and graded as decisions — record them in [DECISIONS.md](DECISIONS.md).

We will run it: clean clone → `make up` → your documented steps. If it needs a hand-holding sequence, document the sequence; undocumented magic counts against, documented pragmatism counts for.

## Beyond the spec

This spec is the floor. Once the core slice works, the submissions that stand out take it somewhere we didn't ask for — a real component library or mini design system, a data model argued from first principles, one extra capability chosen because it drives the *business* case, market or ICP research that changed a decision. If you go there, say so in [DECISIONS.md](DECISIONS.md): what you added, why it mattered more than polishing, and what it cost you. Unasked-for judgment is a feature; unasked-for polish is not.
