FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm ci --workspace @second-brain/backend --include-workspace-root

COPY apps/backend apps/backend
COPY data data
COPY llm-prompts llm-prompts
COPY templates templates

WORKDIR /workspace/apps/backend

CMD ["npm", "run", "dev:api"]
