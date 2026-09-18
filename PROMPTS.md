# PROMPTS — your AI trail

How you drive AI tools is part of what we assess — we *want* you using them, and we want to see how. Keep this honest and lightweight: paste or export the exchanges that mattered, as you go.

This includes the **questions you asked** — of the [context-brain/](context-brain/), of your tools about the problem itself, of us by email. An engineer interrogating "who is this for and what makes it trustworthy?" before building reads very differently from one who opened with "build the thing."

For each significant exchange, a short entry like:

```
## [time] tool: claude-code
**Asked:** paste or summarize the prompt
**Got:** one line on what came back
**Did with it:** took it / rejected it because … / redirected it by …
```

What we're reading for:

- What you **delegated** to the tool vs. kept for yourself
- Whether you **verified** its output before building on it (and how)
- Where you **overrode or redirected** it — the moments the tool was wrong and you caught it
- What you asked to **understand the customer and the problem**, not just to produce code

**Commit the raw session export too.** Claude Code, Cursor, and friends can export full session transcripts — drop them in `prompts/` as-is. **We treat the raw log as the source of truth** and this file as your annotated index on top of it. Don't sanitize the export: dead ends, tool errors, and wrong turns read as experience, not failure. A trail with no wrong turns and no timestamps reads as reconstructed — the only bad version of this file.

> **If you use Claude Code or Cursor, this is already wired up for you.** A stop/session-end hook (`.claude/settings.json` or `.cursor/hooks.json` → `scripts/export-transcript.sh`) copies each session's full transcript into `prompts/raw-session-<id>.jsonl` and rebuilds the auto-index below (`scripts/index-prompts.py`) — no manual export. Just commit what lands in `prompts/` and this file. Edit **Did with it** yourself (took / rejected / redirected); the indexer will keep that line if it does not start with `_(auto)_`. On another tool, drop the raw log in `prompts/` and run `python3 scripts/index-prompts.py`.

---

*(your entries start here — auto-index follows; do not hand-edit Asked/Got inside the markers)*

<!-- auto:prompts-index:start -->
<!-- source: prompts/raw-session-99c95dd3-dec0-47c6-92f2-68636e67def1.jsonl -->
## [Friday, Sep 18, 2026, 11:29 AM (UTC+2)] tool: cursor
**Asked:** I want to go through each Pillar of the SEPCS and decide what to build and how @SPEC.md . Rewrite each pillar content as we go. Let's start with Pillar 1. In @data I see word, excel, power point files. But it looks like we should only support ingestion of .md files right?
_Latest ask:_ S
**Got:** **S is locked.** Pillar 4 in `SPEC.md` is Sam’s morning board. Quoted as `"S"` in `DECISIONS.md` — add **In your own words** yourself. The view: 1. **Needs me** — failed/stuck ingest, error, Retry 2. **Pipeline / KB** — uploaded+seeded by org and status; Ingest Seeds + Add file;…
**Did with it:** _(auto)_ 18 user turn(s), 100 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-9af4e5a2-ce55-441c-aaac-a37b6702c12c.jsonl -->
## [Friday, Sep 18, 2026, 12:19 PM (UTC+2)] tool: cursor
**Asked:** I want your to first clean/update the stack based and what has been updated in @SPEC.md . For example, no LangChain / LangGraph, we will use @xenova/transformers, etc.
_Latest ask:_ to talk to ElasticMQ and minio, should we use AWS SDK?
**Got:** Yes. Use the **AWS SDK** for both: **S3** against MinIO, **SQS** against ElasticMQ. That is what `STACK.md` already locks. ElasticMQ speaks SQS; MinIO speaks S3. The same client code you would use on real AWS, pointed at localhost. **How to point them locally** - MinIO: `endpoin…
**Did with it:** _(auto)_ 3 user turn(s), 33 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-cd4de170-1247-4aa3-b907-82d434f57347.jsonl -->
## [Friday, Sep 18, 2026, 9:34 AM (UTC+2)] tool: cursor
**Asked:** I'm going to use Cursor for this challenge "tt-challenges". I want you first to prepare the codebase to work with Cursos. - convert the ".claude" into a ".cursor" . - Cursor is able to read CLAUDE.md and all other files right? Or do I need to convert it to AGENTS.md ? - other things to convert?
_Latest ask:_ quick question, is it required to create branch or should I just create nice commits on main? Is something mention about that?
**Got:** Nothing in the brief requires a branch or a pull request. `README.md` only says **commit and push everything** (code, `DECISIONS.md`, `PROMPTS.md`) and that they will read **commit history** together with `PROMPTS.md`. Finish is: push, email the **repo link**, book the review. W…
**Did with it:** _(auto)_ 4 user turn(s), 32 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-302c515c-639d-4419-ae1d-a8f19f52f4db.jsonl -->
## [Friday, Sep 18, 2026, 10:22 AM (UTC+2)] tool: cursor
**Asked:** give me a quick overview of each file/topic of @context-brain
_Latest ask:_ ok let's go with "portco brief", add it in decision
**Got:** Logged in `DECISIONS.md`: **portco brief** for Dana (~10 minutes, IC/board), team vs plan — not a profile, comparison, or single-exec brief. Your quotes are in **Said at the time**. Leave **In your own words** for you (why this is right, in your keyboard). I left that line blank…
**Did with it:** _(auto)_ 13 user turn(s), 10 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-81db2343-5eed-4ba9-88e1-bda2efd5a7f1.jsonl -->
## [Friday, Sep 18, 2026, 11:42 AM (UTC+2)] tool: cursor
**Asked:** For Pillar 2 - Converse, does Anthropic provide streaming out of the box with SSE?
**Got:** (no assistant text yet)
**Did with it:** _(auto)_ 1 user turn(s), 0 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-aab682e5-3cfb-44a9-b52a-d76542c94ab5.jsonl -->
## [Friday, Sep 18, 2026, 12:28 PM (UTC+2)] tool: cursor
**Asked:** I know want to create a new .md file for app architecture to defined the app architecture( + ASCII schema) We will have a FE in React, an API, a worker for document ingestion behind an ElasticMQ, a pgvector, a minio.
_Latest ask:_ how should we use generated citations in the app?
**Got:** Use `generated_citations` to power clickable evidence in saved briefs. Recommended flow: 1. API retrieves chunks before generating. 2. Each chunk gets a stable reference such as `[C1]`, `[C2]`. 3. Anthropic writes claims with those references. 4. API validates that every returne…
**Did with it:** _(auto)_ 5 user turn(s), 31 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …
<!-- auto:prompts-index:end -->
