# EESD Modern Masonry Walls DB

0212 - EESD - Modern Masonry Walls DB - A comprehensive database and
collaborative resource for advancing seismic assessment of modern masonry walls.

Static Quasar frontend (`frontend/`, [pnpm](https://pnpm.io) 11) styled with the
[EPFL design system](https://github.com/EPFL-ENAC/epfl-design-skill). It reads
the dataset from `frontend/public/data/` and calls no backend. The FastAPI
backend (`backend/`, [uv](https://docs.astral.sh/uv/)) is kept but unused.

Clone with [git-lfs](https://git-lfs.com) installed: the specimen photos are LFS
objects on ENAC-IT's server. Before the first clone, make git-lfs talk HTTP/1.1
to that server; over HTTP/2 its downloads break with "LFS: unexpected EOF"
([enack8s-core-config#23](https://github.com/EPFL-ENAC/enack8s-core-config/issues/23)):

```bash
git config --global http.https://enac-it-git-lfs.epfl.ch/.version HTTP/1.1
```

## Develop

```bash
make install    # pnpm (git hooks) + uv sync + frontend deps
make dev-all    # backend on :8000 + Quasar on $FRONTEND_PORT (default 9000)
make test       # pytest + vitest
make lint       # ruff (pre-commit) + ESLint + stylelint
```

### Updating the dataset

1. Replace the files in `frontend/public/data/`, then write the CSVs from the
   workbook (Python 3.9+, standard library only):

   ```bash
   python3 frontend/scripts/export-csv.py path/to/ModernMasonryDatabase_EIA.xlsx frontend/public/data
   ```

   It writes the Database, Fields, References and Fig_references CSVs as UTF-8
   with a BOM, the same on any machine. EESD runs the same script before a
   delivery. Excel's own CSV export depends on its language and code page: it
   can lose σ, δ and μ, and the converter rejects it.

2. New or changed photos: `make -C frontend optimize-images` writes their web
   versions (`<name>-512.webp`, `<name>-1920.webp`, git-lfs) beside them. The
   site shows these; downloads keep the originals.
3. `make -C frontend convert` rewrites `frontend/src/assets/data/*.json` and
   fails if the database and the files on disk disagree, or a web version is missing.
4. `make test`, then commit the CSVs, photos, web versions and JSON together.

### Preparing a delivery (for EESD)

The dataset's owners prepare each version in `ModernMasonryDatabase_EIA.xlsx`
and its folders (`02_fd_curve/` … `10_fig_cracks/`, as in its `readme.txt`).
Before sending one:

1. **Keep every test's number.** A number N given in a delivered version
   always refers to the same test: new tests take new numbers, and a removed
   test's number is never reused. Links, citations and file names depend on it
   ([#40](https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-db/issues/40)).
2. **Write the CSVs with
   [`export-csv.py`](frontend/scripts/export-csv.py)**, not Excel's "Save as":
   download the script next to the workbook and run
   `python3 export-csv.py ModernMasonryDatabase_EIA.xlsx` (Python 3.9+,
   nothing to install). It writes the Database, Fields, References and
   Fig_references CSVs beside the workbook, in UTF-8.
3. **Check the workbook and folders:**
   - every row of the Database sheet has data, not just its N;
   - each Reference ID appears once in the References sheet, and every
     Reference in the Database sheet is one of them;
   - "Yes" in F-d data, Env curve or Bil curve, or a method in Crack
     measurements, comes with its files named after N (`fd_curve_0227.csv`,
     `fig_cracks_0227.jpg`…), and every file belongs to a test in the table;
   - no template or empty files are left in the folders.

   The site's import (`make -C frontend convert`) refuses a delivery whose
   references, flags or files disagree.

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
