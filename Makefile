# Lifecycle for the backing services. Extend freely — keep `make up` the entry point.

COMPOSE ?= docker compose
SVC ?=

.PHONY: help up down reset ps logs psql

help: ## List available commands
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[1m%-8s\033[0m %s\n", $$1, $$2}'

up: ## Start the backing services (Postgres+pgvector :5432, MinIO :9000/:9001, ElasticMQ :9324)
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  postgres  → localhost:5432  (brain / brain, db: secondbrain)"
	@echo "  minio     → localhost:9000  (console :9001 — minio-root / minio-secret)"
	@echo "  queue     → localhost:9324  (SQS-compatible)"
	@echo ""
	@echo "  All empty. Schema, buckets, queues — and the product — are yours. See SPEC.md."

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
