# Product overview — the Second Brain

*Everything here is fictional. It describes the product this repo is a small version of.*

## What it is

The **Second Brain** is a talent-intelligence platform used by private-equity funds to hire, assess, and monitor the leaders of the companies they own. A fund drops in the documents it already generates during a search — job specs, interview notes, candidate scorecards, reference calls, board reviews — and the Second Brain turns that scattered record into something structured, searchable, and comparable across every search and every portfolio company.

The one-line version: **the memory and judgment layer for how a fund makes its people decisions.**

## The two surfaces

- **The Second Brain (fund level).** The core product, used by the fund's talent function. Ingests documents, answers questions across the whole portfolio ("show me every COO we've assessed who scored low on financial rigor"), and generates the structured artifacts of a search — scorecards, assessments, and the **talent review** (the portfolio-wide read on leadership health).
- **The Portco Workspace (portco level, $8–15K/portco).** A scoped view that sits *under* a fund. A portfolio company's HR leader gets access to their own company's data; the fund's talent partner sees across all their portcos; no portco can see another. This is the expansion motion — land at the fund, grow into the companies underneath it.

## Where it sits in the work

A fund runs a leadership search roughly like this, and the Second Brain touches every step:

1. **Define the role** — turn "we need a new CFO for Cascade" into a scorecard: the mission, the measurable outcomes, the competencies, the red flags.
2. **Assess candidates** — capture interviews and references, score each candidate against the scorecard, surface the gaps and the disagreements between interviewers.
3. **Decide** — produce the assessment the deal partners actually read before they approve a hire.
4. **Defend the decision** — stand behind the call at the investment committee (IC), with the evidence traceable.
5. **Monitor** — roll every exec across every portco into the **talent review**: who's performing, who's a flight risk, who's ready for more.

## What makes it different from an ATS

An applicant tracking system moves candidates through pipeline stages. The Second Brain does not care about pipeline mechanics — it cares about **judgment and memory**: was this the right hire, on what evidence, and what did we learn that makes the next search better. It never starts from scratch; every search compounds on the last. It is opinionated about *how* to assess (it encodes a methodology), and it keeps an audit trail of who decided what, on what basis.

## What it deliberately does not do

- It does not source or aggregate candidates (no LinkedIn scraping revamp).
- It does not make the hire/no-hire call. It surfaces evidence, pros and cons, and gaps — **a human always decides.** Customers ask for explainability, not a verdict.
- It is not general HR software for non-PE companies.

## Why any of this is load-bearing for an engineer

The product's whole promise is **trust**. A fund is making a decision worth tens of millions on the strength of what this system tells them. That means: a wrong answer delivered confidently is far worse than an honest "I don't know," a score has to trace back to its evidence, and one portco must never see another's data. Those three properties — grounded answers, provenance, isolation — are the product, not features on top of it. Keep them in mind when you decide what "working" means.
