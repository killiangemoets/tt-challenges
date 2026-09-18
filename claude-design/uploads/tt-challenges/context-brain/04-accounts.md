# Account profiles

*Entirely fictional. The fund in the box, plus a few peer accounts so "customers like ours" is concrete. No resemblance to any real client is intended. The DAW facts below track the `data/` corpus (the authoritative source of truth for the fund in the box); the peer accounts are illustrative sketches with no corpus of their own.*

## DAW Capital — the fund in this repo

- **Profile:** lower-middle-market buyout fund, ~$680M AUM (Fund I 2019 + Fund II 2023), founded 2018, based in Denver. Three Fund II platform companies across healthcare, IT/managed services, and logistics. Typical hold 4–6 years.
- **Talent function:** led by **Hema Varadarajan**, Operating Partner (Human Capital & Talent), with one associate (**Sam Iyer**). Deal decisions run through the Investment Committee, chaired by Managing Partner **Dana Deline**. Runs 6–10 senior searches a year.
- **Why they bought:** got burned on a portfolio CFO mis-hire in 2023 that cost ~15 months and a chunk of the deal's return. Wanted their hiring judgment made repeatable and their decisions defensible at IC.
- **How they use the Second Brain:** all C-suite searches run through it; the talent review is presented at the semi-annual portfolio review. Early on the Portco Workspace with two portcos (Cascade Care Group, Vantage Managed Services).

### DAW's portfolio companies (the portcos in `data/`)

| Code | Company | Sector | Note |
|---|---|---|---|
| **PC1** | **Vantage Managed Services** | IT / managed services (MSP) | Roll-up of regional MSPs; CTO flight-risk is the top EV exposure |
| **PC2** | **Cascade Care Group** | Healthcare provider services | The most data-rich portco; the escalate case — COO retention is the critical risk |
| **PC3** | **Ridgeline Freight & Logistics** | Transportation & logistics (3PL) | The healthy team; orderly founder-CEO succession is the defining task |

> The three portcos are separate tenants. A Vantage user must never see Cascade or Ridgeline data — that isolation is our customers' #1 gate, and the reason the Portco Workspace can exist at all. It's why document-to-org provenance belongs in your data model from the first migration.

## Peer accounts — "customers like ours"

Fictional funds that fit the ICP, sketched so the shape of the customer base is tangible.

### Fenwick Park Capital
- ~$3B AUM, 22 portcos, healthcare + consumer. Larger and more process-heavy than DAW; a formal IC with strict documentation standards. Their talent partner is the archetype for "defensible at IC" — she has been caught out by an un-sourceable number in the room and never wants it to happen again. Bought primarily for the audit trail.

### Arden Bridge Partners
- ~$700M AUM, 9 portcos, industrials. Small talent team (one person, no associate). Bought for leverage — wants the fund's judgment encoded so one person can cover nine companies. Heavy user of cross-portfolio search ("who have we assessed who's done a carve-out integration?").

### Sightline Growth
- ~$1.1B AUM, growth equity, 18 portcos, software. Values the compounding-memory flywheel most — runs frequent VP/director searches inside portcos and wants each to build on the last. Most aggressive adopter of the Portco Workspace.

## What the peer set tells an engineer

Across all of them the same three properties keep coming up as the reason they bought and the reason they'd leave: **grounded answers, traceable provenance, and hard isolation.** Different funds weight them differently — Fenwick Park lives on provenance, Sightline on the flywheel, Arden Bridge on leverage — but no account tolerates a confident wrong answer or a data leak. That's the floor the product stands on.
