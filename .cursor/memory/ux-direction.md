# UX direction

`DESIGN.md` is directional, non-binding. Override with rationale in `DECISIONS.md`. Grade: one coherent product for a specific person.

## Design system

- Register: **calm, evidentiary, expensive** — IC memo, not SaaS carnival. Readers: talent partner + deal partners who quote output in IC.
- Tokens (starter):

| Token | Suggestion |
|-------|------------|
| Surface | paper `#FAF8F3`; cards `#FFFFFF`; border `#E3E0D8` |
| Ink | `#1D2129`; muted `#6B7280` |
| Accent | one — patina green `#2F6F4F` |
| Signal | amber attention; `#B3402F` failure, sparingly |
| Type | serif headings/docs (Georgia-ish); system sans UI |

- Component library: **shadcn/ui + Radix** (STACK). Generated output should read as **documents**, not chat bubbles.

## Layout and navigation

- Surfaces implied by spec: ingest/status, chat, generated document + trust chrome, dashboard.
- Dashboard: **Sam’s morning** (needs-me failed/stuck, pipeline/KB by org, generated briefs split from uploads). Ingest Seeds / Add file on this surface. Not vanity counters. Hema glance; Dana never logs in.
- Generous whitespace, real tables; no gradients, glass, emoji in product UI.

## Interaction

- **Every number interrogable** — evidence one click from score/claim.
- **Status always visible** — queued / processing / ready / failed.
- **Brain never bluffs** — uncited vs cited visually distinct; “I don’t know” is a first-class answer, not an error.
- Quiet chrome, loud evidence (sources, provenance, flags).
- Trust surface (checkpoint 6): citations per claim, metadata, flags/alerts, next steps — chosen for the checkpoint-1 reader.

## Anti-patterns

- Generated doc as a giant chat bubble.
- Fake confidence (green checks, 98% with nothing behind them).
- Dashboard of “42 documents!” that answers no user question.
- Ten accent colors.
