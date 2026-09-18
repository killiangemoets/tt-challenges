# DECISIONS — your build log

Keep this as you go, not from memory at the end. Alongside your code and [PROMPTS.md](PROMPTS.md), it's the main thing we read. Short and honest beats polished.

> If you're building with an AI agent, it's been asked ([CLAUDE.md](CLAUDE.md)) to pause at key decision points and put the call to **you** — use case, cuts, data model, pipeline shape, grounding, the trust surface. It records your answers **verbatim**; the _"in your own words"_ lines below are for **your keyboard only** — your agent has been told not to write them. To be straight about why: we don't mind who typed this file, but the thinking has to be yours, and the review is where we check — we'll probe these decisions live and cross-reference the quotes against your raw session transcript. A messy honest log beats a polished generated one, every time.

## How to run what I built

Exact steps from a clean clone. We follow these literally.

```
1. Create an .env file with the `ANTHROPIC_API_KEY`env variable
2. Run the `make up` command to start all the services

Note: use `make reset` to reset everything.

# Development endpoints
# Frontend:    http://localhost:5173
# API health:  http://localhost:3000/health
# API docs:    http://localhost:3000/api-docs.html
# MinIO:       http://localhost:9001

# Verification
make build
make typecheck
make lint
make test
```

## The use case I chose

I chose to generate a porcto brief for Dana (Managing Partner, IC chair).
Indeed, Dana won't really use the app, but she is the one that needs a document generated. She need a read she can trust and read in about 10 minutes before going in the Investment Committee (IC).
She mostely needs answers to this kind of question 'Does this leadership team still support the thesis, and do we intervene?' which is more a question about a unit/team, not about one person. That's why the "porcto brief" is the perfect document to generate for her.

## Decisions & trade-offs + What I cut

### 1. Ingestion pipeline

For the Pillar 1 — Ingest, I chose to only support .md files.
Indeed, extract text from documents like .docx, .pptx, .xlsx would takes time to handle. It would require external libraries like mammoth, exceljs, etc and it would take some time do handle it cleanly.

The document ingestion worker will do the following steps:

1. extract text from documents
2. cut in chunks
3. embed chunks
4. insert chunks in DB

Embedding: To embed (and retreive) the chunks, I chose to work with the library @xenova/transformers.
We could maybe use a bigger tool like Voyage AI, but it seems overkilled for this project, and the only external dependency allowed is Anthropic API.
Also, maybe using Full-Text Search (FTS) can be a possibility instead of embedding but it won't be very efficient. So a library like @xenova/transformers seemed to be the right choice here.

Error handling: Having a DLQ didn't seem relevant to me for this small prototype.
So here is what I did:

- When a document fails to be processed, it then has the state 'failed' in the DB, with the error/reason of the failure.
- This 'failed' state of the document appears clearly for the user in the frontend with a clear error message.
- In the frontend, we have a "Retry" button that will re-push the document in the queue for the ingestion to be retried.

Ranking: I skipped this point. No time for this and "reranking" is useful when we have a lot of chunks/documents. Here the app stay small so we can have good results without reranking.

### 3. Converse + grounding

Since it's a very small conversational bot, it doensn't make sense to me use LangChain / LangGraph. This is more useful when building a multi agents pipeline, where the state change at each step, and it also take more time to setup. I chose to talk to the Anthropic API directly.

I decided to handle streaming and to stream the response to the user since Anthropic API handle streaming easily with SSE, so it doesn't require a lot of effort to handle streaming.

I also decided to add a filter on proctos. Since is was already required to do data isolation by organisations/proctos, I think it makes sense to filter on what proctos' documents we want to ask a question so we are confident that the answer is accurate and using the right data.

Since it's a small app build in a short timebox I don't handle multiple conversations at the same time, and conversations storing.

### 4. Document generation

To stay in the timebox, I choose to generate a .md file.

Also, the best, in my opinion, seemed to create a template for this "porcto brief". Since Dana needs to read it in 10 minutes, if the document is always organised the same way, it will be faster for her to read it and find the information she is looking for.

To make the document trustworthy. I get the citations for the file generated and store it in the database. In the frontend on the generated .md file, I display the number of citations as well as the source for each paragraph.

I chose to handle the document generation synchronously (directly in the API). It seems fine this small app in the timebox we have. But for bigger file generation, we should thinkg about make is asynchrone (behing an SQS queue).

I skipped the bullet point "Could: The saved document is itself re-ingested — the brain can retrieve and cite it in later conversations. Full loop.". I was not able to tackle everything and in my opinion this was not the most impotant/intersting "Could" bullet point.

### 5. Dashboard reader

The dashboard is designed to be Sam’s morning board (needs-me + pipeline + generated briefs). Pretty much all the actions can be done quickly from the dahsboard.

### 4. App libraries

I chose to work with Fastify on the backend, since it the framework I used the most lately. I chose the ORM Prisma bc it's very modern, easy to use. Migrations and seeds are easy to do with Prisma.

I chose to add zod to have run time validation. In my opinion, it's really important to avoid bugs and handle errors nicely, especially when vibecoding.

I chose to work with ShadCN, Radix UI, and TailwindCSS. It allows a great accessibility, already have a light UI and since Shadcn and allow control over components (since ShadCN is a collection, we have control on the code of the components)

No SSR ofc, it not relevant here.

### 4. Repository structure

I place a lot of importance on having clean, readable well-structured code. I think it's especially important to keep the codebase structured these days, when we're vibecoding at a fast pace and generating a large number of lines of code.

So I quickly set up (with Cursor) a small repository architecture.
I chose to split backend and frontend. Since some services like the database should be accessible by both the api and worker but not the frontend.
On bigger project, we could have a mono repo with a common folder (sharing schemas, types, etc) between frontend and backend. But it didn't worth it here for this very small app, in my opinion.

### 4. API specs, DB schema, App Design

I decided to build the database schema, the apic specs and to generate a quick Claude Design mockup (with a small iteration on this loop) before starting generating the code.

First, it allowed me to make sure that everything will be build in the right direction directly, in a consistent and solid way. And so it avoids iterations afterward to improve codebase structure and quality, or to fix bugs.

Then, it allowed to have the scope for the frontend and backend to be very clear and strict, and so to launch the code generation for frontend and backend both at the same time.

Not much to say about the very simple database schema, except the fact that there is an `organization_id`column in both the `documents` and `chunks` table to guarantee data isolation between organisations.

### Decision: LLM prompts in git (versioned)

I chose to keep LLM prompts and the porcto brief template in git (with versioning). For this small project it's the easiest and fastest way to store it.

## If I had another day

- One of the first things I would do is to support other document types like .docx, .pdf and .xlsx . Indeed, only supporting .md files doens't make the app useful in real life

- I would also handle authentication. It we want to deploy the app, this point is the most important one. Then it will lead to users management and probably multi-role permissions. --> This will then enable more collaboration within the team on the platform.

- Then I would maybe also allow to export more document types, like an exec brief for example. For that, we would need to store the list of employees. When genereting an exec brief, we should then select an employee.
