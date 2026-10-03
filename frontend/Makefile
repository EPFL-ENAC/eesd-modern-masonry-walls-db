.PHONY: help install dev test lint convert optimize-images

help:                   ## Show available targets
	@grep -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:                ## pnpm install
	pnpm install

dev:                    ## Quasar dev server on $$FRONTEND_PORT
	pnpm run dev

test:                   ## vitest, one run
	pnpm run test:unit run

lint:                   ## ESLint + stylelint
	pnpm run lint

convert:                ## public/data CSVs -> src/assets/data JSON
	pnpm run convert

optimize-images:        ## public/data photos -> 512/1920 px WebP beside them
	pnpm run optimize-images
