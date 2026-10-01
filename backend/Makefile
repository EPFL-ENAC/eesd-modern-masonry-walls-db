BACKEND_PORT ?= 8000

.PHONY: help install dev test lint update

help:                   ## Show available targets
	@grep -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:                ## uv sync
	uv sync

dev:                    ## uvicorn with reload on BACKEND_PORT (default 8000)
	DOTENV_PATH_FOR_DYNACONF="../secrets/.env" uv run uvicorn modernmasonrydatabase.main:app --reload --port $(BACKEND_PORT)

test:                   ## pytest
	uv run pytest

lint:                   ## ruff + ruff-format through pre-commit, all files
	uv run pre-commit run --all-files

update:                 ## pre-commit autoupdate
	uv run pre-commit autoupdate
