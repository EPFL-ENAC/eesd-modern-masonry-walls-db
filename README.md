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
`frontend/public/data/` and calls no backend. `backend/` (FastAPI) is kept but
unused.

## Getting started

You need:

- [Node](https://nodejs.org) 26 and [pnpm](https://pnpm.io) 11
- [uv](https://docs.astral.sh/uv/) (`make install` also sets up the unused backend)
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

## Preparing a delivery (for EESD)

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

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `LFS: unexpected EOF` on clone or pull | Set git-lfs to HTTP/1.1 (see [Getting started](#getting-started)), then `git lfs pull`. |
| Photos are broken, or are ~130-byte text files | git-lfs wasn't installed when you cloned: `git lfs install && git lfs pull`. |
| `convert-data: … has no UTF-8 BOM`, or a header with `?` | The CSV came from Excel's "Save as": write it with `export-csv.py`. |
| `Database.csv must start with its "#1, #2…" row` | Same: Excel kept the workbook's title row. |
| `specimen N: "F-d data" is Yes but 02_fd_curve lacks its file` (or the reverse) | A flag and the files disagree: fix the workbook or the folder, and tell EESD. |
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
