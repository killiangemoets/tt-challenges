FROM node:22-bookworm-slim

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm ci --workspace @second-brain/backend --include-workspace-root

COPY apps/backend apps/backend

WORKDIR /workspace/apps/backend

CMD ["npm", "run", "dev:api"]
