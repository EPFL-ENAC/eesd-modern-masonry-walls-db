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
`localhost` from the EPFL network or VPN. It reads the dataset from
`frontend/public/data/`. Only the Submit page calls the backend (`backend/`,
FastAPI), to check and send a contribution.

## Getting started

You need:

- [Node](https://nodejs.org) 26 and [pnpm](https://pnpm.io) 11
- [uv](https://docs.astral.sh/uv/) for the backend
- Python 3.9+ to export a new dataset
- [git-lfs](https://git-lfs.com), set to HTTP/1.1 for ENAC-IT's LFS server
  **before the first clone**. Over HTTP/2 its downloads break with
  "LFS: unexpected EOF"
  ([enack8s-core-config#23](https://github.com/EPFL-ENAC/enack8s-core-config/issues/23)).

```bash
git config --global http.https://enac-it-git-lfs.epfl.ch/.version HTTP/1.1
git clone git@github.com:EPFL-ENAC/eesd-modern-masonry-walls-db.git
cd eesd-modern-masonry-walls-db
make install         # git hooks, backend and frontend dependencies
make dev-frontend    # the site on http://localhost:9000 ($FRONTEND_PORT)
```

```bash
make test            # pytest + vitest
make lint            # ruff (pre-commit) + ESLint + stylelint
make dev-all         # also starts the backend on :8000
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org)
(checked by commitlint through lefthook). PRs target `dev`.

## How data reaches the site

```text
EESD's workbook and folders               frontend/public/data/                 frontend/src/assets/data/
ModernMasonryDatabase_EIA.xlsx ── export-csv.py ──▶ *.csv ───── pnpm convert ─────▶ *.json ──▶ bundled in the app
02_fd_curve/ … 06_bilinear_curve_EPFL/ ──────────▶ *.csv ───── served as /data/… ─────────▶ loaded by the F-d chart
07_fig_setup/ … 10_fig_cracks/ ──────────────────▶ *.jpg ── optimize-images ──▶ -512.webp, -1920.webp (shown)
```

- `frontend/public/data/` holds the delivery as EESD sends it. The site
  serves it as is, so every download is the original file.
- `pnpm convert` (`frontend/scripts/convert-data.ts`) turns the CSVs into the
  JSON the app bundles. It refuses a delivery whose columns, references, flags
  or files disagree.
- Photos are git-lfs objects. The site shows their WebP web versions;
  downloads keep the originals.
- In the app, `src/api/dataset.ts` is the only module that reads the dataset,
  and `src/lib/derive.ts` holds the derived values (drift, τ, bins…).

## Updating the dataset

1. Replace the files in `frontend/public/data/`, then write the CSVs from the
   workbook:

   ```bash
   python3 frontend/scripts/export-csv.py path/to/ModernMasonryDatabase_EIA.xlsx frontend/public/data
   ```

   It writes the Database, Fields, References and Fig_references CSVs as UTF-8
   with a BOM, the same on any machine. Excel's own CSV export depends on its
   language and code page: it can lose σ, δ and μ, and the converter rejects it.

2. New or changed photos: `make -C frontend optimize-images` writes their web
   versions (`<name>-512.webp`, `<name>-1920.webp`, git-lfs) beside them.
3. `make -C frontend convert` rewrites `frontend/src/assets/data/*.json`.
4. `make test`, then commit the CSVs, photos, web versions and JSON together.

## How a contribution reaches the site

```text
contributor ── Submit page ──▶ POST /api/validate ──▶ report (errors, warnings)
            ── Submit page ──▶ POST /api/contributions ──▶ branch contrib/<id> + PR into dev
PR adds submissions/<id>/ ──▶ CI job "submissions" runs the validator on it
curator ──▶ reviews the PR ──▶ merges it
workflow "ingest" ──▶ next N, rows appended, curves renamed, pnpm convert ──▶ push to dev ──▶ deploy
```

1. The contributor fills the starter kit and uploads it on the Submit page.
   The page sends it to `POST /api/validate`, which answers with a report.
2. The contributor sends it with name, email and institution to
   `POST /api/contributions`. The backend checks it again, commits it to
   `submissions/<id>/` on branch `contrib/<id>`, and opens a PR into `dev`.
3. CI runs the validator on each changed `submissions/<id>/`:
   `cd backend && uv run python -m modernmasonrydatabase.contribution ../submissions/<id>`.
4. A curator reviews the PR and merges it.
5. The `ingest` workflow ([`.github/workflows/ingest.yml`](.github/workflows/ingest.yml))
   runs `make ingest SUBMISSION=submissions/<id>`. It gives each new test the
   next free N and appends its row to the Database CSV. It renames the curve
   files after N and runs `pnpm convert`. Then it deletes the submission
   folder, pushes the result to `dev` and starts the deploy.

The validator is
[`backend/modernmasonrydatabase/contribution.py`](backend/modernmasonrydatabase/contribution.py).
It compares the contribution with the dataset on `CONTRIBUTIONS_BASE`, which it
reads from GitHub and keeps for 10 minutes.

### Contributions configuration

The backend reads these environment variables.

| Variable | Default | Meaning |
| --- | --- | --- |
| `CONTRIBUTIONS_REPO` | `EPFL-ENAC/eesd-modern-masonry-walls-db` | Repository that receives the PRs. |
| `CONTRIBUTIONS_BASE` | `dev` | Branch the PRs target. The validator reads the dataset from it. |
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

## Reviewing a contribution (for curators)

1. Read the warnings in the PR body. The validator lists them there.
2. A new reference must be in the dataset before the merge. Add its row to
   `frontend/public/data/01_references/ModernMasonryDatabase_EIA_References.csv`
   (and its entry to the .bib file). Push this commit to the PR branch, then
   merge. Otherwise the ingest fails.
3. A row with "Crack measurements" set needs its crack photo, and the ingest
   does not take photos. Leave the value empty, or add the test by hand.
4. If the `ingest` workflow fails, read its log. Fix the cause on `dev`. Then
   run `make ingest SUBMISSION=submissions/<id>` on your computer, commit the
   result and push it.

## Correcting the dataset

The CSVs in `frontend/public/data/` are the master copy. EESD's workbook is
no longer the source. To correct the data, open a PR that edits the CSVs. Run
`pnpm convert` and commit the JSON with the CSVs.

Keep every test's number. A number N always refers to the same test: new
tests take new numbers, and the number of a removed test is never used again.
Links, citations and file names depend on it
([#40](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/40)).

[`export-csv.py`](frontend/scripts/export-csv.py) stays only for a one-time
import of a workbook. It writes the Database, Fields, References and
Fig_references CSVs in UTF-8 with a BOM.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `LFS: unexpected EOF` on clone or pull | Set git-lfs to HTTP/1.1 (see [Getting started](#getting-started)), then `git lfs pull`. |
| Photos are broken, or are ~130-byte text files | git-lfs wasn't installed when you cloned: `git lfs install && git lfs pull`. |
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
