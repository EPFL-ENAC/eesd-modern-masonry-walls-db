# EESD Modern Masonry Walls DB

0212 - EESD - Modern Masonry Walls DB - A comprehensive database and
collaborative resource for advancing seismic assessment of modern masonry walls.

Static Quasar frontend (`frontend/`, [pnpm](https://pnpm.io) 11) styled with the
[EPFL design system](https://github.com/EPFL-ENAC/epfl-design-skill). It reads
the dataset from `frontend/public/data/` and calls no backend. The FastAPI
backend (`backend/`, [uv](https://docs.astral.sh/uv/)) is kept but unused.

Clone with [git-lfs](https://git-lfs.com) installed: the specimen photos are LFS
objects.

## Develop

```bash
make install    # pnpm (git hooks) + uv sync + frontend deps
make dev-all    # backend on :8000 + Quasar on $FRONTEND_PORT (default 9000)
make test       # pytest + vitest
make lint       # ruff (pre-commit) + ESLint + stylelint
```

### Updating the dataset

1. Replace the files in `frontend/public/data/`. Export CSVs from Excel as
   **CSV UTF-8**: a plain CSV export loses σ, δ and μ, and the converter rejects it.
2. `make -C frontend convert` rewrites `frontend/src/assets/data/*.json` and
   fails if the database and the files on disk disagree.
3. `make test`, then commit the CSVs and the JSON together.

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
