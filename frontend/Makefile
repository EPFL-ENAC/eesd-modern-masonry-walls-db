.PHONY: help install dev test lint convert optimize-images

help:                   ## Show available targets
	@grep -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:                ## npm install
	npm install

dev:                    ## Quasar dev server on $$FRONTEND_PORT
	npm run dev

test:                   ## vitest, one run
	npm run test:unit -- run

lint:                   ## ESLint + stylelint
	npm run lint

convert:                ## public/data CSVs -> src/assets/data JSON
	npm run convert

optimize-images:        ## public/data photos -> 512/1920 px WebP beside them
	npm run optimize-images
