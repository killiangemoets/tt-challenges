# PROMPTS — your AI trail

How you drive AI tools is part of what we assess — we _want_ you using them, and we want to see how. Keep this honest and lightweight: paste or export the exchanges that mattered, as you go.

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

_(your entries start here — auto-index follows; do not hand-edit Asked/Got inside the markers)_

<!-- auto:prompts-index:start -->
<!-- source: prompts/raw-session-99c95dd3-dec0-47c6-92f2-68636e67def1.jsonl -->

## [Friday, Sep 18, 2026, 11:29 AM (UTC+2)] tool: cursor

**Asked:** I want to go through each Pillar of the SEPCS and decide what to build and how @SPEC.md . Rewrite each pillar content as we go. Let's start with Pillar 1. In @data I see word, excel, power point files. But it looks like we should only support ingestion of .md files right?
_Latest ask:_ S
**Got:** **S is locked.** Pillar 4 in `SPEC.md` is Sam’s morning board. Quoted as `"S"` in `DECISIONS.md` — add **In your own words** yourself. The view: 1. **Needs me** — failed/stuck ingest, error, Retry 2. **Pipeline / KB** — uploaded+seeded by org and status; Ingest Seeds + Add file;…
**Did with it:** _(auto)_ 18 user turn(s), 100 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

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

<!-- source: prompts/raw-session-ea40f012-3396-4016-99f9-5a1c25deae02.jsonl -->

## [Friday, Sep 18, 2026, 12:43 PM (UTC+2)] tool: cursor

**Asked:** based on @SPEC.md @DATABASE_SCHEMA.md @ARCHITECTURE.md I want you to write a file API_SPECS.md with all the api route we will need to build, their shape, params, input and ouput schemas. The goal is to build both the FE and BE in parrallelel based on that file
_Latest ask:_ in addition, API_SPECS should also contains the SPECS for the ingestion worker
**Got:** `API_SPECS.md` now includes a full **ingest worker** contract (no HTTP). The worker only consumes the queue, reads MinIO, and writes Postgres. **Queue:** ElasticMQ name `ingest`, body `{ documentId }`, long poll 20s, visibility 300s, **no DLQ**, concurrency 1. **Status:** worker…
**Did with it:** _(auto)_ 2 user turn(s), 20 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-059b176e-b84e-4905-b895-d30729f6bcc0.jsonl -->

## [Friday, Sep 18, 2026, 3:18 PM (UTC+2)] tool: cursor

**Asked:** when I click on "Ingest seeds", I get "Queued 0 seed documents; skipped 30." why? it should ingest the seeds!
_Latest ask:_ I have a cors origin issue, fix it Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools :5173/chat:1 Access to fetch at 'http://localhost:3000/api/v1/chat/stream' from origin 'http://localhost:5173' has been blocked by CORS pol…
**Got:** CORS is fixed — the chat and brief streams now return `access-control-allow-origin`. The cause was the SSE path, not the CORS config. `@fastify/cors` was registered correctly with `http://localhost:5173`, but it sets its headers on the Fastify reply object, which only get flushe…
**Did with it:** _(auto)_ 2 user turn(s), 4 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-a02d197f-a7b4-4abc-8226-91ddc8841f6a.jsonl -->

## […] tool: cursor

**Asked:** <command-message>refresh-memory</command-message> <command-name>/refresh-memory</command-name>
_Latest ask:_ 57 CLAUDE.md 31 .claude/memory/active-context.md 29 .claude/memory/architecture.md 73 .claude/memory/business-logic.md 66 .claude/memory/conventions.md 46 .claude/memory/project-brief.md 45 .claude/memory/stack-and-deps.md 34 .claude/memory/ux-direction.md 381 total
**Got:** Project memory initialized. Created `.claude/memory/` with 7 files (project-brief, business-logic, stack-and-deps, architecture, conventions, ux-direction, active-context) and rewrote the root [CLAUDE.md](CLAUDE.md) into a dense operational front page with a memory index. Key th…
**Did with it:** _(auto)_ 19 user turn(s), 8 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-76d86670-0cc9-4f41-8f3a-1faa06e26fa8.jsonl -->

## [Wednesday, Sep 16, 2026, 4:04 PM (UTC+2)] tool: cursor

**Asked:** @SPEC.md explique moi ce point: | **Must** | From the chat, the user can have the brain **generate a document** grounded in the knowledge base. Pick a use case the customer would love — a **candidate profile** assembled from interviews/references, a **comparison of candidates in a search**, an **exec or portco brief** — one is enough; `context-brain/` will tell you which is worth building. |
_Latest ask:_ @tt-challenges/.claude/settings.json converti ces hooks en hooks cursor dans .cursor, same for memory pour le project tt-ch
**Got:** Je suis en **Ask mode** : je ne peux pas créer `.cursor/` ni copier la mémoire. Passe en **Agent mode** et redemande — je ferai le mapping ci-dessous. ## Hooks Claude (`.claude/settings.json`) → Cursor (`.cursor/hooks.json`) : | Claude | Cursor | |--------|--------| | `Stop` | `…
**Did with it:** _(auto)_ 86 user turn(s), 11 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-6035b0d9-3e55-42ed-981a-614a384511a7.jsonl -->

## [Friday, Sep 18, 2026, 2:00 PM (UTC+2)] tool: cursor

**Asked:** Use the /node-backend-expert to build the backend of the application. All the api specs are described in @API_SPECS.md , also@ARCHITECTURE.md respect @DATABASE_SCHEMA.md @REPO_ARCHITECTURE.md @STACK.md @SPEC.md Important: write strong unit tests for all routes and worker! YOU ARE ONLY ALLOWED TO EDIT @apps/backend Add the end, the backend should be fully fonctional in @DATABASE_SCHEMA.md I want o…
_Latest ask:_ since I added my api key in @.env , the api doesn't start, can you check why? @/Users/killiangemoets/.cursor/projects/Users-killiangemoets-Documents-Projects-made-brabo-biotoop-be/terminals/19.txt:992-1003
**Got:** Your API key was not the cause. The whole stack is back up and healthy. **What actually broke:** `api` and `worker` both ran `prisma generate` on startup against the same bind-mounted `apps/backend/node_modules`. The worker won the race and the API died renaming the query-engine…
**Did with it:** _(auto)_ 4 user turn(s), 17 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-65a5e7da-1070-4d60-9669-882fea0176a7.jsonl -->

## [Friday, Sep 18, 2026, 1:53 PM (UTC+2)] tool: cursor

**Asked:** Use the /react-frontend-expert and all your react skills (this one /react-data-hooks is very important!) to build the frontend of the application. All the api specs are described in @API_SPECS.md . Also respect @STACK.md @SPEC.md The design to follow is in @claude-design YOU ARE ONLY ALLOWED TO EDIT @apps/frontend Add the end, the frontend should be fully fonctional.
_Latest ask:_ I get a lot of of 404 when trying to call the backend. The app is running on http://localhost:5173/ and the backend on http://localhost:3000/api-docs.html, can you check what's wrong?
**Got:** The 404s came from a mismatch over who owns the `/api/v1` prefix. Compose passes `VITE_API_URL: http://localhost:3000` — just the origin — but the axios client treated that value as the complete base path, so every call hit `http://localhost:3000/organizations`, `/dashboard`, et…
**Did with it:** _(auto)_ 3 user turn(s), 1 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-422075c9-3826-4dc7-a201-70f1ff2a97d9.jsonl -->

## [Friday, Sep 18, 2026, 3:33 PM (UTC+2)] tool: cursor

**Asked:** it looks like the button "Ingest seeds" is useless? When I open the app it seems that all the seeds docuents are already ingested?
_Latest ask:_ it shold not skip the word, excel and power point files from @data . We should see this file on the app with clear error message
**Got:** Implemented. - Ingest Seeds now registers `.md`, `.docx`, `.xlsx`, and `.pptx`. - Office files are stored in MinIO, queued, then visibly marked failed. - Error shown: “This Office file cannot be parsed yet. Convert it to Markdown (.md), then upload it.” - Binary content is not r…
**Did with it:** _(auto)_ 3 user turn(s), 16 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-154d8284-94bc-4632-a3de-625a3cb2cfc3.jsonl -->

## [Friday, Sep 18, 2026, 1:39 PM (UTC+2)] tool: cursor

**Asked:** I have a design generated by claude @claude-design . Can you analyse it deeply and check if it's consistent with @SPEC.md @API_SPECS.md @DATABASE_SCHEMA.md ? If no, what are the differences?
_Latest ask:_ do so
**Got:** `API_SPECS.md` and `DATABASE_SCHEMA.md` now match the Claude Design prototype. Recorded as **"do so"** plus your two selections: cross-portfolio chat, and all v2 additions. **Chat retrieve** is fund ∪ 0–3 portcos (`portcoOrganizationIds`). Generate stays one portco ∪ fund. Fund…
**Did with it:** _(auto)_ 3 user turn(s), 40 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-52c0e2d1-a659-498d-99fe-85cf7e5d015f.jsonl -->

## [Friday, Sep 18, 2026, 12:49 PM (UTC+2)] tool: cursor

**Asked:** @ARCHITECTURE.md @DATABASE_SCHEMA.md @STACK.md @SPEC.md @docker-compose.yml how do you see the architecture of the codebase? A mono repo? I was thinking something like that. What do you think? apps/backend/ src/ api/ worker/ common/ schemas/ database/ helpers/ services/ (build on top of database models) prompts/ apps/frontend/ src/ components/ constants/ hooks/ data/ ui/ pages/ schemas/ helpers/
_Latest ask:_ Bootstrap repository services Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself. To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't…
**Got:** Bootstrap complete. `make up` now runs: - React/Vite: `localhost:5173` - Fastify health/docs: `localhost:3000` - Idle worker - PostgreSQL, MinIO, ElasticMQ Verified successfully: - `make build` - `make typecheck` - `make lint` - `make test` — 2 passing - Clean stop/start - All s…
**Did with it:** Took it — used the repo architecture and accepted plan to bootstrap the Dockerized npm-workspaces frontend, API, worker, and backing services.

<!-- source: prompts/raw-session-aab682e5-3cfb-44a9-b52a-d76542c94ab5.jsonl -->

## [Friday, Sep 18, 2026, 12:28 PM (UTC+2)] tool: cursor

**Asked:** I know want to create a new .md file for app architecture to defined the app architecture( + ASCII schema) We will have a FE in React, an API, a worker for document ingestion behind an ElasticMQ, a pgvector, a minio.
_Latest ask:_ in what pillar generated citations is needed? is it due to "with **citations to a real passage**" in @SPEC.md?
**Got:** No. That **Must** is **Pillar 2 (Converse)** — live chat. Those citations should come from the **closing SSE event**, not from `generated_citations`. Chat turns are not persisted in this slice. `generated_citations` is for **Pillar 3 (Generate)**: a saved portco brief Dana can r…
**Did with it:** _(auto)_ 6 user turn(s), 31 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-9af4e5a2-ce55-441c-aaac-a37b6702c12c.jsonl -->

## [Friday, Sep 18, 2026, 12:19 PM (UTC+2)] tool: cursor

**Asked:** I want your to first clean/update the stack based and what has been updated in @SPEC.md . For example, no LangChain / LangGraph, we will use @xenova/transformers, etc.
_Latest ask:_ to talk to ElasticMQ and minio, should we use AWS SDK?
**Got:** Yes. Use the **AWS SDK** for both: **S3** against MinIO, **SQS** against ElasticMQ. That is what `STACK.md` already locks. ElasticMQ speaks SQS; MinIO speaks S3. The same client code you would use on real AWS, pointed at localhost. **How to point them locally** - MinIO: `endpoin…
**Did with it:** _(auto)_ 3 user turn(s), 33 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-e95759a2-8ebd-49a3-8346-7228b048c568.jsonl -->

## [Friday, Sep 18, 2026, 5:58 PM (UTC+2)] tool: cursor

**Asked:** in the document generated the numbers [...] do not refer to anything. Not clickable and no footer note giving the ref, fix it.
**Got:** Fixed. The `[n]` markers in a saved brief were dead because `generated_citations` stored only the `chunk_id` and the template `section` — the number itself was thrown away at persist time, so the frontend had nothing to match `[3]` against. `MarkdownView` was already able to ren…
**Did with it:** _(auto)_ 1 user turn(s), 21 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-design-second-brain.json -->

## [Friday, Sep 18, 2026, 3:10 PM (UTC+2)] tool: cursor

**Asked:** I want to create a design for this app tt-challenges. DO NOT EDIT IN THE FOLDER !! I see it in 3 screens: a dashboard, a chat screen, a screen with all the documents uploaded/generated. IMPORTANT: respect the api specs OR create a new api_specs file
_Latest ask:_ can you add this conv in /Users/killiangemoets/Documents/perso/tt-challenges/prompts
**Got:** No write access to your local disk — writing the transcript here and handing it over as a download.
**Did with it:** _(auto)_ 8 user turn(s), 8 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …

<!-- source: prompts/raw-session-6e55a558-909f-40a1-bd6f-b8184053d162.jsonl -->

## [Sunday, Sep 20, 2026, 10:23 AM (UTC+3)] tool: cursor

**Asked:** @TEST/tt-challenges @TEST/tt-challenges/DECISIONS.md @/Users/killiangemoets/.cursor/projects/Users-killiangemoets-Documents-perso-tt-challenges/terminals/2.txt:22-210 what is wrong?
**Got:** Applied and left uncommitted in the main repo. `git diff` there is exactly the four lines shown above, byte-identical to the version I verified in the TEST clone. I also patched `.cursor/memory/stack-and-deps.md` so the note about `migrate` owning `prisma generate` now records w…
**Did with it:** _(auto)_ 1 user turn(s), 9 file-edit tool call(s). Replace this line with: took it / rejected it because … / redirected it by …
<!-- auto:prompts-index:end -->
