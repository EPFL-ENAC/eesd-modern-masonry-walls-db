.PHONY: help install dev test lint

help:                   ## Show available targets
	@grep -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:                ## pnpm install
	pnpm install

dev:                    ## Vite dev server
	pnpm run dev

test:                   ## vitest, one run
	pnpm run test:unit run

lint:                   ## ESLint with auto-fix
	pnpm run lint
