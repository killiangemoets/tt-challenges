# Lifecycle for the complete local development stack.

COMPOSE ?= docker compose
SVC ?=

.PHONY: help up down reset ps logs psql build lint test typecheck

help: ## List available commands
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[1m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Build and start the complete development stack
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  frontend  → http://localhost:5173"
	@echo "  api       → http://localhost:3000  (docs: /api-docs.html)"
	@echo "  worker    → ingest worker process (idle scaffold)"
	@echo "  postgres  → localhost:5432  (brain / brain, db: secondbrain)"
	@echo "  minio     → localhost:9000  (console :9001 — minio-root / minio-secret)"
	@echo "  queue     → localhost:9324  (SQS-compatible)"
	@echo ""
	@echo "  Product schema, buckets, queues, and features are not initialized yet."

down: ## Stop everything (keeps data volumes)
	$(COMPOSE) down

reset: ## Wipe volumes and start clean
	$(COMPOSE) down -v
	$(MAKE) up

ps: ## Show container states
	$(COMPOSE) ps

logs: ## Tail logs — all services, or one with SVC=name
	$(COMPOSE) logs -f --tail=100 $(SVC)

psql: ## SQL shell into the running database
	$(COMPOSE) exec db psql -U brain -d secondbrain

build: ## Build backend and frontend in Docker
	$(COMPOSE) run --rm api npm run build
	$(COMPOSE) run --rm frontend npm run build

lint: ## Lint backend and frontend in Docker
	$(COMPOSE) run --rm api npm run lint
	$(COMPOSE) run --rm frontend npm run lint

test: ## Run backend tests in Docker
	$(COMPOSE) run --rm api npm run test

typecheck: ## Typecheck backend and frontend in Docker
	$(COMPOSE) run --rm api npm run typecheck
	$(COMPOSE) run --rm frontend npm run typecheck
