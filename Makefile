up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose down && docker compose up -d --build

health:
	curl -fsS https://wayesports.duckdns.org/api/health

smoke:
	bash scripts/smoke-system.sh https://wayesports.duckdns.org

smoke-admin:
	@if [ -z "$(TOKEN)" ]; then echo "Usage: make smoke-admin TOKEN=<jwt>"; exit 1; fi
	bash scripts/smoke-admin.sh https://wayesports.duckdns.org "$(TOKEN)"

release-check:
	bash scripts/release-check.sh https://wayesports.duckdns.org "$(TOKEN)"

