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
<!-- source: prompts/raw-session-cd4de170-1247-4aa3-b907-82d434f57347.jsonl -->
## [Friday, Sep 18, 2026, 9:34 AM (UTC+2)] tool: cursor
**Asked:** I'm going to use Cursor for this challenge "tt-challenges". I want you first to prepare the codebase to work with Cursos. - convert the ".claude" into a ".cursor" . - Cursor is able to read CLAUDE.md and all other files right? Or do I need to convert it to AGENTS.md ? - other things to convert?
_Latest ask:_ quick question, is it required to create branch or should I just create nice commits on main? Is something mention about that?
**Got:** Nothing in the brief requires a branch or a pull request. `README.md` only says **commit and push everything** (code, `DECISIONS.md`, `PROMPTS.md`) and that they will read **commit history** together with `PROMPTS.md`. Finish is: push, email the **repo link**, book the review. W…
**Did with it:** _(auto)_ 4 user turn(s), 32 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …
<!-- auto:prompts-index:end -->
