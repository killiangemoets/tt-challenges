# The talent review — deep context

*Fictional. The product's highest-stakes output — and the richest source of use cases for what your brain should generate. Read this before choosing what to build.*

## What it is

The **talent review** is the portfolio-wide read on leadership health: every executive across every portfolio company, scored on the competencies that matter for their role, with **flight risk** and **high-potential** flagged, mapped to each company's value-creation plan. It's the answer to a deal partner's question: *"where is leadership strong across our portfolio, where is it a risk, and who's ready for more?"*

It rolls up from everything the fund has captured — scorecards, assessments, reference calls, board reviews — so it only exists because the individual searches fed it. It is the compounding-memory payoff made visible.

## Who reads it, and where

- **The talent partner (Hema)** builds it and owns it.
- **Deal partners and GPs (Dana)** read it at the **semi-annual portfolio review** and at individual **portco board meetings**.
- Ultimately it informs **investment-committee-level** conversations: whether to back a management team, where to intervene, whether a leadership gap threatens the deal thesis.

The reader who matters most is the one who **doesn't use the app** — the partner who encounters a single number ("the COO of a portco scores a 3 on Execution, against a target of 5") in a slide at a board meeting and has to decide what to do about it.

## Why "defensible" is the entire game

A talent-review score isn't a dashboard metric. It's an assertion about a specific human being's capability, presented to the people who decide that person's future and the fund's money. So the score carries a burden ordinary analytics don't:

- **It must be interrogable.** When a partner asks *"why is this a 4.2?"*, the answer can't be "the model said so." It has to unfold into the evidence — which assessments, which references, which observed outcomes — and the reader has to be able to follow it down to the source.
- **A wrong score is worse than no score.** An empty cell prompts a question. A confident, wrong number gets *acted on* — a good operator gets managed out, or a weak one gets left in place — before anyone checks the foundation. This is the failure the product exists to prevent.
- **The evidence is uneven.** Some scores rest on three independent reference calls and a year of board observation. Others rest on one interview and a candidate-supplied reference. **These should not look the same on the page**, and today they often do.

That last point is the crux of what this product is for: partners don't fully trust a score — or a generated document — they can't interrogate. The gap worth closing is the one between *a number* and *a number you can stand behind in a hostile room.*

## The provenance problem

Here's the failure mode the product is always one bad assumption away from.

A score is only as trustworthy as the evidence lineage beneath it. Two ways that lineage silently breaks:

1. **Identity merge.** Two executives with the same or similar name get collapsed into one record, so one person's glowing reference lands on the other's score. The number looks well-supported; it's attached to the wrong human.
2. **Source-reliability blindness.** A reference the *candidate* chose and introduced is treated as equal in weight to one the fund sourced independently and back-channeled. Independent, corroborated evidence and self-selected, un-corroborated evidence get averaged into the same score with no distinction.

Either way the review reports a confident number built on compromised evidence — exactly the thing Dana can't afford to repeat at IC. And no status dashboard will ever flag it: every service shows green, the app "works," and the output is wrong. In this product, "working" means *the output is true*, not just *the app runs*.

## What a strong generated document tends to do

(Not a rubric — orientation. There's no single right build.)

- Makes **evidence visible next to the score** — you can see what the number rests on without leaving the screen.
- **Distinguishes reliability** — independent/corroborated evidence is weighted and shown differently from self-selected/un-corroborated evidence.
- Lets a reader **drill from a number to its sources** and back — the interrogation path Dana needs.
- Surfaces **confidence and gaps honestly** — "this score rests on one un-corroborated reference" is more valuable than a clean-looking number.
- Ideally, **treats trust as the feature** — the strongest builds notice that evidence, provenance, and honest gaps are what make a generated document worth keeping, and design for them from the start.

A weak answer adds polish — nicer charts, more filters — without touching the reason the number can't be trusted. The brief is about **trust and defensibility**, not presentation.
