FROM node:22-bookworm-slim

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm ci --workspace @second-brain/frontend --include-workspace-root

COPY apps/frontend apps/frontend

WORKDIR /workspace/apps/frontend

CMD ["npm", "run", "dev"]
