# EESD Modern Masonry Walls DB

0212 - EESD - Modern Masonry Walls DB - A comprehensive database and
collaborative resource for advancing seismic assessment of modern masonry walls.

FastAPI backend (`backend/`, managed with [uv](https://docs.astral.sh/uv/)) and
Vue 3 + Vuetify frontend (`frontend/`, [pnpm](https://pnpm.io) 11).

## Develop

```bash
make install    # pnpm (git hooks) + uv sync + frontend deps
make dev-all    # backend on :8000 + Vite on :5173 (/api proxied to the backend)
make test       # pytest + vitest
make lint       # ruff (pre-commit) + ESLint
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org)
(checked by commitlint through lefthook).

## Deploy

| Git ref | Environment | URL |
| --- | --- | --- |
| `dev` branch | dev | https://modernmasonrydb-dev.epfl.ch |
| `v*.*.*` tag (release-please PR on `main`) | prod | https://modernmasonrydatabase.epfl.ch |

PRs target `dev`. [`deploy.yml`](.github/workflows/deploy.yml) builds both
images and points the overlays in
[enack8s-app-config/epfl-eesd/modernmasonrydatabase](https://github.com/EPFL-ENAC/enack8s-app-config/tree/main/epfl-eesd/modernmasonrydatabase)
at the new digests; Argo CD syncs the cluster.
