# Glossary

*Fictional-world reference. Plain-language definitions of the PE, talent, and product terms used across this brain and the app.*

## Private equity

- **GP (General Partner)** — the fund manager. DAW Capital is a GP. The partners who run deals and sit on portco boards.
- **LP (Limited Partner)** — the investors whose money the fund manages (pensions, endowments, family offices). The GP answers to them.
- **Portfolio company / portco** — a company the fund owns. Vantage Managed Services, Cascade Care Group, and Ridgeline Freight & Logistics are DAW's portcos.
- **Hold / hold period** — how long the fund owns a company before selling, typically 4–6 years. Leadership quality over the hold drives the return.
- **Investment Committee (IC)** — the partners' decision-making forum; approves deals and major calls. The room where a talent decision has to be *defensible*.
- **Value-creation plan (VCP)** — the plan for how a portco's value grows over the hold (revenue, margin, add-ons). Talent decisions are judged against it.
- **Add-on** — a smaller company bought and folded into an existing portco. Often triggers leadership needs (e.g. a bigger CFO after several add-ons).
- **Carve-out** — a business unit bought out of a larger company; operationally messy, needs strong leadership to stand up.
- **Exit / exit multiple** — the sale of a portco; the multiple of invested capital returned. Strong leaders raise it; mis-hires lower it.

## Talent & assessment

- **Scorecard** — the definition of success for a role: mission, measurable outcomes, competencies, red flags. Written *before* assessing anyone. The output of JTBD 1.
- **Competency** — a capability that predicts success in a role (e.g. "Execution & Results", "Stakeholder Trust", "Financial Acumen" — the corpus scores five such families). Scored per candidate.
- **Assessment** — the evidence-backed evaluation of a candidate against the scorecard; the document a deal partner reads before approving a hire. Output of JTBD 3.
- **Reference / reference call** — a structured conversation with someone who worked with the candidate. **Independent** (fund-sourced, back-channeled) references carry more weight than **candidate-supplied** ones.
- **Back-channel** — reaching a reference the candidate *didn't* provide, through the fund's own network. Higher-signal because it isn't curated by the candidate.
- **Flight risk** — an exec likely to leave; flagged in the talent review.
- **High-potential (hi-po)** — an exec ready for a bigger role; flagged in the talent review.
- **Mis-hire** — a hire that fails against the scorecard; in this world, the catastrophic-cost event the product exists to reduce.

## Product

- **The Second Brain** — the fund-level platform: ingest documents, ask questions across the portfolio, generate scorecards / assessments / the talent review.
- **Portco Workspace** — the scoped, portco-level product ($8–15K/portco) that sits under a fund; a portco sees only its own data.
- **Talent review** — the portfolio-wide leadership-health output; the product's highest-stakes artifact. See `05-talent-review.md`.
- **Search** — one hiring effort for one role (e.g. "Cascade CFO search"). Has a status: open, in-progress, closed.
- **Candidate** — a person being assessed in a search.
- **Provenance / lineage** — the traceable chain from a score back to the specific evidence it rests on. The property that makes a score *defensible*.
- **Isolation / tenancy** — the guarantee that one org's (or portco's) data is never visible to another. Enforced at the database layer (RLS). Checklist item 4 is this guarantee, stated as a user.
- **Grounded answer** — an answer generated only from retrieved source documents, with a citation that traces to a real line — not the model's general knowledge.

## Challenge-internal (for orientation, not shown to end users)

- **PC1 / PC2 / PC3** — the three portcos: Vantage Managed Services / Cascade Care Group / Ridgeline Freight & Logistics.
