FROM python:3.12-slim AS build-stage
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
ENV UV_LINK_MODE=copy UV_COMPILE_BYTECODE=1

# Layer 1: deps only, cached until pyproject.toml / uv.lock change
COPY pyproject.toml uv.lock /app/
RUN uv sync --frozen --no-dev --no-install-project

# Layer 2: the project
COPY README.md /app/
COPY ./modernmasonrydatabase /app/modernmasonrydatabase
RUN uv pip install --no-deps . \
    && test -d /app/.venv/lib/python3.12/site-packages/modernmasonrydatabase


FROM python:3.12-slim AS production-stage
EXPOSE 8000
WORKDIR /app
COPY --from=build-stage /app/.venv /app/.venv

# The ingress strips /api before the request reaches the app; root_path keeps
# the OpenAPI docs pointing at /api/openapi.json.
ENV PATH="/app/.venv/bin:${PATH}" \
    PYTHONUNBUFFERED=1 \
    ROOT_PATH=/api

CMD [ "uvicorn", "modernmasonrydatabase.main:app", "--host", "0.0.0.0", "--port", "8000" ]
