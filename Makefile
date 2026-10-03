.PHONY: help install dev-all dev-backend dev-frontend test lint

help:                   ## Show available targets
	@grep -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:                ## pnpm (git hooks) + backend + frontend deps
	pnpm install
	$(MAKE) -C backend install
	$(MAKE) -C frontend install

dev-all:                ## backend + frontend in this terminal, Ctrl-C stops both
	$(MAKE) -j2 --no-print-directory dev-backend dev-frontend

dev-backend:            ## FastAPI on http://127.0.0.1:8000 (unused by the frontend)
	$(MAKE) -C backend dev

dev-frontend:           ## Quasar on http://127.0.0.1:$FRONTEND_PORT (default 9000)
	$(MAKE) -C frontend dev

test:                   ## backend pytest + frontend vitest
	$(MAKE) -C backend test
	$(MAKE) -C frontend test

lint:                   ## backend ruff (pre-commit) + frontend ESLint
	$(MAKE) -C backend lint
	$(MAKE) -C frontend lint
