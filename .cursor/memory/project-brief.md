# Project brief

## Purpose

- Team Theory take-home: build a thin slice of **the Second Brain** for fictional PE fund **DAW Capital**.
- Product: ingest scattered people-docs → searchable memory → grounded chat → **generate a document the fund keeps** → dashboard.
- Primary reader of generated output: fund talent partner (and IC they answer to). Not an ATS; never auto hire/no-hire.

## Goals

- End-to-end *must* on all four pillars in **2–3 hours**: ingest `data/` async with visible status → cited converse → one saved generated doc → dashboard.
- Clean clone → `make up` → documented steps on a stranger’s machine.
- Honest `DECISIONS.md` + `PROMPTS.md` + raw `prompts/` transcripts (reviewers cross-check quotes).
- Interrogate `context-brain/` before building; questions are graded.

## Non-goals

- All four pillars at *could* / gold-plating the spec.
- Swapping STACK families (Next/SSR, Hono, Pinecone, Redis-as-queue, LangChain/LangGraph).
- External services besides Anthropic (no hosted embeddings).
- Agent filling candidate-only DECISIONS fields or inventing checkpoint answers.

## Constraints

- Timebox 2–3h; cuts are graded. Thin slice > gold plate.
- Tech families in `STACK.md` / `.cursor/memory/stack-and-deps.md`.
- Grounding: no citation, no claim; “I don’t know” when corpus is silent.
- Fund vs portco provenance in the data model (full ACL *could*; thinking is *must*).
- Fictional corpus; local experiment safe; `make reset` wipes volumes.
