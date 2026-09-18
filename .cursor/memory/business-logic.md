# Business logic

Source of truth for customer/product narrative: `context-brain/` (read those files for depth). Below is agent-dense for features.

## Domain

- **Team Theory:** PE talent intelligence — memory and defensibility for people decisions. Buyer = fund talent function; expansion Portco Workspace.
- **DAW Capital (corpus):** ~$680M AUM, Denver, LMM buyout. Talent: **Hema Varadarajan** (Op Partner Talent, primary user), **Sam Iyer** (associate, pipeline). IC chair **Dana Deline**. 2023 CFO mis-hire; ~6–10 senior searches/year.
- **Portcos:** PC1 **Vantage Managed Services** (IT/MSP, CTO flight risk); PC2 **Cascade Care Group** (healthcare, data-rich, COO retention); PC3 **Ridgeline Freight & Logistics** (3PL, founder succession, healthier team).
- **Entities to model (candidate schema):** org (fund vs portco), source document, chunk, generated artifact, ingest job/status. Identity/provenance mistakes look like a working app with wrong output.

## Rules

- Four pillars: ingest, converse, generate (heart), dashboard.
- Generate use cases (pick one): candidate profile, search comparison, exec/portco brief — tied to a real decision and reader (checkpoint 1).
- Generated doc **saved into KB** as a **separate kind** from uploads (DB + UI). Re-ingest loop is *could* / cut for now. Template: `templates/portco-brief.md`.
- **Never auto hire/no-hire.** Product = judgment support + audit trail, not a verdict machine.
- Isolation: customers’ #1 gate; provenance must be representable even if ACL is *could*. Uploads set org via dropdown (fund / PC1 / PC2 / PC3); seeds stamp org from `data/` path.
- Grounding invariant: every claim traces to a real passage; uncited ≠ cited; gaps stated. Chat: retrieve then generate; **stream answer tokens** (typing); **citations at end of turn**. Versioned prompts in `llm-prompts/v1/`. Send prior turns to Anthropic. Retrieve with `@xenova/transformers`. Scope: optional PC1/PC2/PC3 ∪ **fund**; no portco = fund only. No PC→PC. Enforce in SQL.
- Talent review / IC: uneven evidence must not look uniform; flags (e.g. single independent reference) are product, not decoration.

## Workflows (JTBD)

1. Define role (scorecard) → 2. Assess → 3. Decide (assessment) → 4. Defend at IC → 5. Monitor (talent review).
- Currency = **traceable evidence**. Chat is how documents get *made* (multi-turn *should*).

## Edge cases

- Bad file: fail that document, show status, keep pipeline up. Retry re-enqueues; no DLQ. Non-`.md` rejected FE+BE. Office under `inbox/office/` not parsed.
- Corpus silent: refuse to invent.
- Cross-portco bleed: schema should make isolation thinkable.
- Merge/identity of people across docs: silent failure mode if ignored.

## Terminology

- **Second Brain** — this product. **ICP** — mid-market PE ~$500M–$5B AUM, 10–40 portcos; poor fit = verdict machine / ATS replacement / single company.
- **Must / should / could** — SPEC tiers. **Thin slice** — all four *musts*, not one pillar *could*.
- Glossary: `context-brain/06-glossary.md`.
