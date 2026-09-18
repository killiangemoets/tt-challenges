# DECISIONS — your build log

Keep this as you go, not from memory at the end. Alongside your code and [PROMPTS.md](PROMPTS.md), it's the main thing we read. Short and honest beats polished.

> If you're building with an AI agent, it's been asked ([CLAUDE.md](CLAUDE.md)) to pause at key decision points and put the call to **you** — use case, cuts, data model, pipeline shape, grounding, the trust surface. It records your answers **verbatim**; the *"in your own words"* lines below are for **your keyboard only** — your agent has been told not to write them. To be straight about why: we don't mind who typed this file, but the thinking has to be yours, and the review is where we check — we'll probe these decisions live and cross-reference the quotes against your raw session transcript. A messy honest log beats a polished generated one, every time.

## How to run what I built

Exact steps from a clean clone. We follow these literally.

```
make up
# then …
```

## The use case I chose

Which document your brain generates (profile / comparison / brief / other), and why — who is it for, what decision does it support? (This is where reading [context-brain/](context-brain/) shows.)

## Decisions & trade-offs

One block per significant decision (the checkpoint ones at minimum — use case, cuts, data model, pipeline shape, grounding, trust surface):

```
### Decision: …
- **The call:** what you chose
- **Said at the time:** "…" (verbatim, captured by your agent from the conversation)
- **What I gave up:** the trade-off
- **In your own words (typed by you, not your agent):** why this was right
```

## What I cut

The parts of [SPEC.md](SPEC.md) you deliberately didn't build, and why those were the right cuts for a 2–3 hour slice. Cuts recorded here are graded as product decisions; things silently missing are graded as gaps.

## If I had another day

Two or three sentences: what you'd build next, harden, or test — and the first thing you'd ship.
