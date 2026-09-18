# User personas

*Fictional. The people who touch the Second Brain, and what they need from it. Where a persona maps to a real person in the `data/` corpus we use that name (Hema Varadarajan owns the talent program; Dana Deline chairs the IC); the portco-level names are illustrative.*

## 1. The Talent Partner — primary user & buyer

**Example: Hema Varadarajan, Operating Partner (Human Capital & Talent), DAW Capital.**

Owns leadership hiring and talent health across the whole portfolio. Sat in an operating role before this; is not a recruiter and not an engineer. Runs 6–10 senior searches a year across the portfolio, and is accountable for the outcome of every one.

- **What they want from the product:** leverage. They can't personally run every search, but they're on the hook for all of them. They want the fund's judgment encoded once and applied consistently — and they want to walk into an investment committee able to defend any hire on evidence.
- **What they fear:** a confident wrong answer they repeat to a deal partner. A score they can't back up when a GP pushes on it. A mis-hire they signed off on.
- **How they use it:** reviews scorecards and assessments before they go to deal partners; pulls the talent review before board meetings; asks cross-portfolio questions ("which of our operators have turned around a struggling P&L before?").
- **They are the person the talent review has to satisfy.** If they can't defend it, the product failed.

## 2. The Portco HR Leader — secondary user (Portco Workspace)

**Example: Marcus Boone, VP People, Cascade Care Group.**

Runs people operations at a single portfolio company. Gets a *scoped* view — only Cascade's data — through the Portco Workspace. Cares about his own hires and his own team's health; does not (and must not) see other portcos.

- **What he wants:** help running searches for his own leadership roles without reinventing the fund's process each time; a clean handoff with the fund's talent partner.
- **What he fears:** the fund seeing a half-finished, messy assessment before he's ready; his data leaking to a peer company in the portfolio.
- **Why he matters to an engineer:** he is the reason **isolation is non-negotiable**. The whole expansion motion depends on a portco trusting that its data stays its own. One cross-portco leak and the Workspace product is dead.

## 3. The Deal Partner / GP — the IC audience

**Example: Dana Deline, Managing Partner (Investments) and IC chair, DAW Capital.**

Sponsors deals; sits on portco boards; chairs the investment committee. Rarely logs in. Encounters the product's output *secondhand* — in the assessment the talent partner brings to a hiring decision, and in the talent review at a board meeting.

- **What they want:** a decision they can trust in about ten minutes, and evidence they can point to if it goes wrong.
- **What they fear:** being embarrassed at IC by a number they can't source. Approving a hire on a score that turns out to be built on sand.
- **Why they matter to an engineer:** they are who "**defensible at IC**" is about. They are the reader of the product's output who never touches the UI — so the *output* has to carry its own credibility. When you're deciding what a generated document needs around it to be trusted, **they are the person you're designing for.**

## 4. The Talent Associate — the power user

**Example: Sam Iyer, Talent Associate, DAW Capital.**

Hema's leverage. Does the day-to-day: sets up searches, uploads documents, chases references, drafts the first pass of scorecards and assessments. In the product every day.

- **What they want:** speed and no dropped context. Upload a reference call and have it processed and searchable now, not after a refresh-and-pray. Never re-key something the system already knows.
- **What they fear:** silent failures — a document that "uploaded" but never got processed, so an assessment is missing a reference nobody noticed was gone.
- **Why they matter to an engineer:** they feel every pipeline glitch first. An upload stuck at "Processing" and a status that only moves on a hard refresh are *their* daily pain. When you fix the ingestion path, you're fixing Sam's job.

## How the personas map to what you build

- **Choosing your use case** — Sam is your heaviest chat-and-generate user (profiles, comparisons, first drafts); Hema is who takes a generated document into a real decision; Dana is who that document ultimately has to convince. A feature that helps Sam produce what Hema can defend to Dana is on the money.
- **Judging what matters** — something that breaks the app is loud and hurts Hema and Sam; something that quietly makes an output *wrong* has no one complaining at all — and costs the most, in the highest-stakes room. Weight your effort by who is hurt and what they're deciding, not by noise.
