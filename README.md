# EESD Modern Masonry Walls DB

A database of in-plane shear-compression tests on modern unreinforced masonry
walls, collected by EPFL's Earthquake Engineering and Structural Dynamics lab
(EESD): wall and material properties, test setup, force-displacement curves,
Pavia and EPFL bilinear idealisations, and photos, for 236 tests.

- **Site:** https://modernmasonrydatabase.epfl.ch (dev: https://modernmasonrydb-dev.epfl.ch)
- **Data sources:** 226 tests from Morandi et al. (2018) and Morandi & Albanesi
  (2026), as updated by their authors, plus 10 tests from an EPFL campaign; see
  the site's Documentation page.
- **Citing:** a citation file is on its way
  ([#35](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/35)).
  Until then, cite the publication listed for each test.
- **Code licence:** [GPL-3.0](LICENSE).

The site is a static Quasar app (`frontend/`) styled with the
[EPFL design system](https://github.com/EPFL-ENAC/epfl-design-skill), vendored
in [`frontend/vendor/epfl-design-system/`](frontend/vendor/epfl-design-system/README.md).
Its fonts come from `enac-it-fonts.epfl.ch`, which serves `*.epfl.ch` sites, and
`localhost` from the EPFL network or VPN. The dataset lives in a separate
repository, [EPFL-ENAC/eesd-modern-masonry-walls-data](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-data). Only the Submit page calls the backend (`backend/`,
FastAPI), to check and send a contribution.

## Getting started

You need:

- [Node](https://nodejs.org) 26 and [pnpm](https://pnpm.io) 11
- [uv](https://docs.astral.sh/uv/) for the backend
- [git-lfs](https://git-lfs.com) for the photos of the dataset. `make data`
  sets it to HTTP/1.1 for ENAC-IT's LFS server. Over HTTP/2 its downloads break
  with "LFS: unexpected EOF"
  ([enack8s-core-config#23](https://github.com/EPFL-ENAC/enack8s-core-config/issues/23)).

```bash
git clone git@github.com:EPFL-ENAC/eesd-modern-masonry-walls-db.git
cd eesd-modern-masonry-walls-db
make install         # git hooks, backend and frontend dependencies
make data            # copy the dataset (branch dev) and convert it
make dev-frontend    # the site on http://localhost:9000 ($FRONTEND_PORT)
```

```bash
make test            # pytest + vitest (run make data first)
make lint            # ruff (pre-commit) + ESLint + stylelint
make dev-all         # also starts the backend on :8000
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org)
(checked by commitlint through lefthook). PRs target `dev`.

## How data reaches the site

The dataset lives in [EPFL-ENAC/eesd-modern-masonry-walls-data](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-data), under `data/`.
`make data` (`frontend/scripts/fetch-data.sh`) copies it into
`frontend/public/data/`, then runs `pnpm convert`. Git ignores both folders
below. `DATA_REF` selects the branch or tag of the data repository (default
`dev`). `SKIP_LFS=1` keeps the photos as LFS pointer files, which is enough
for `pnpm convert` and the tests. `frontend/public/data/.data-ref` records the
data commit.

- The dev site takes the `dev` branch of the data repository (test data).
- The prod site (a `v*.*.*` tag) takes the newest `data-*` tag of the data
  repository. If there is no such tag, it takes `main`.

```text
frontend/public/data/ (copy of data/)                    frontend/src/assets/data/
*.csv ─────────────────────────────────── pnpm convert ─────▶ *.json ──▶ bundled in the app
02_fd_curve/ … 06_bilinear_curve_EPFL/*.csv ── served as /data/… ──▶ loaded by the F-d chart
07_fig_setup/ … 10_fig_cracks/*.jpg ── optimize-images ──▶ -512.webp, -1920.webp (shown)
```

- The site serves the files in `frontend/public/data/` as they are, so every
  download is the original file.
- `pnpm convert` (`frontend/scripts/convert-data.ts`) turns the CSVs into the
  JSON the app bundles. It refuses a dataset whose columns, references, flags
  or files disagree.
- Photos are git-lfs objects. The site shows their WebP web versions.
  Downloads keep the originals.
- In the app, `src/api/dataset.ts` is the only module that reads the dataset,
  and `src/lib/derive.ts` holds the derived values (drift, τ, bins…).

## How a contribution reaches the site

```text
contributor ── Submit page ──▶ POST /api/validate ──▶ report (errors, warnings)
            ── Submit page ──▶ POST /api/contributions ──▶ branch contrib/<id> + PR in the data repository
```

1. The contributor fills the starter kit and uploads it on the Submit page.
   The page sends it to `POST /api/validate`, which answers with a report.
2. The contributor sends it with name, email and institution to
   `POST /api/contributions`. The backend checks it again, commits it to
   `submissions/<id>/` on branch `contrib/<id>` of `CONTRIBUTIONS_REPO`, and
   opens a PR into `CONTRIBUTIONS_BASE`.
3. The data repository checks, reviews and ingests the PR. Its
   [README](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-data#readme) tells the curators how.

The validator is the `mmw_data.validate` module of the data repository
(package `mmw-data` in its `tools/` folder, pinned in `backend/pyproject.toml`).
It compares the contribution with the dataset at `DATASET_PATH` on
`CONTRIBUTIONS_BASE`, which it reads from GitHub and keeps for 10 minutes.

### Contributions configuration

The backend reads these environment variables.

| Variable | Default | Meaning |
| --- | --- | --- |
| `CONTRIBUTIONS_REPO` | `EPFL-ENAC/eesd-modern-masonry-walls-data` | Repository that receives the PRs. |
| `CONTRIBUTIONS_BASE` | `dev` | Branch the PRs target: `dev` for the dev site, `main` for prod. The validator reads the dataset from it. |
| `DATASET_PATH` | `data/ModernMasonryDatabase_EIA_Database.csv` | Path of the Database CSV in that repository. |
| `CONTRIBUTIONS_REVIEWERS` | empty | GitHub logins to ask for review, separated by commas. |
| `CONTRIBUTIONS_MAX_OPEN` | `25` | Open contribution PRs above which new ones get a 429. |
| `GITHUB_APP_ID` | none | GitHub App ID. |
| `GITHUB_APP_PRIVATE_KEY` | none | GitHub App private key (PEM). |
| `GITHUB_APP_INSTALLATION_ID` | none | GitHub App installation ID on the repository. |
| `GITHUB_TOKEN` | none | A token to use instead of the App. |

Contributions open when all three `GITHUB_APP_*` variables are set, or
`GITHUB_TOKEN`. Without them, `/api/contributions` answers 503 and
`/api/validate` still works. The App or token needs `contents: write` and
`pull_requests: write` on the repository. The deployment does not set these
credentials yet.

## Correcting the dataset

Corrections and contribution reviews happen in the data repository. Its
[README](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-data#readme) gives the rules.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Photos are broken, or are ~130-byte text files | `make data` ran with `SKIP_LFS=1`, or git-lfs is not installed. Install git-lfs and run `make data` again. |
| `Cannot find module '../assets/data/specimens.json'` | Run `make data`. |
| `convert-data: … has no UTF-8 BOM`, or a header with `?` | The CSV came from Excel's "Save as": save it again as "CSV UTF-8", or write it with `export-csv.py`. |
| `Database.csv must start with its "#1, #2…" row` | Same: Excel kept the title row of the sheet. |
| `specimen N: "F-d data" is Yes but 02_fd_curve lacks its file` (or the reverse) | A flag and the files disagree: fix the CSV or the folder. |
| `…: no specimen N in the database` | A file for a test the table doesn't have: a leftover template, or a renumbered test. |
| `N photo web versions missing` | `make -C frontend optimize-images`. |

## Deploy

| Git ref | Environment | URL |
| --- | --- | --- |
| `dev` branch | dev | https://modernmasonrydb-dev.epfl.ch |
| `v*.*.*` tag (release-please PR on `main`) | prod | https://modernmasonrydatabase.epfl.ch |

[`deploy.yml`](.github/workflows/deploy.yml) builds both images and points the
overlays in
[enack8s-app-config/epfl-eesd/modernmasonrydatabase](https://github.com/EPFL-ENAC/enack8s-app-config/tree/main/epfl-eesd/modernmasonrydatabase)
at the new digests; Argo CD syncs the cluster.
