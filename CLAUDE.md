# CLAUDE.md

Commands and layout: [README.md](README.md). Team rules: the ENAC IT4R
conventions (`it4r-agent-kit`); this file only adds what is specific here.

- The site is static except the Submit page. It calls the backend's contribution
  API (`/api/validate`, `/api/contributions`). A contribution lands as a PR that
  adds `submissions/<id>/` in the data repository. The validator is
  `mmw_data.validate` (package `mmw-data` from that repository).
- The dataset lives in EPFL-ENAC/eesd-modern-masonry-walls-data, under `data/`
  (photos in git-lfs). Its CSVs are the master copy (no xlsx). This repository
  holds no dataset. `make data` copies it into `frontend/public/data/` and runs
  `pnpm convert`, which writes `frontend/src/assets/data/*.json`. Git ignores
  both. Run `make data` before tests and type-check. Corrections and ingests
  happen in the data repository.
- CSVs are UTF-8 with a BOM (Windows Excel needs it), the dataset's and every one
  the browser generates. `scripts/export-csv.py` only imports a workbook once.
  `pnpm convert` rejects a BOM-less CSV.
- The Pavia [VI] and EPFL [VII] bilinear columns share their names (`Vbil+`, `δu+`…):
  read values by `Field.key` (EPFL keys end in ` [VII]`, see `METHOD_SUFFIX`), never by name.
- Photos show as WebP web versions (`pnpm optimize-images`, `src/lib/photos.ts`);
  downloads and exports keep the originals.
- `src/api/dataset.ts` is the only module that reads the dataset.
- Derivations (drift, τ, bins, `fm_group`…) live in `src/lib/derive.ts`, ported
  from the handoff's `build_charts.py`. This overrides the IT4R "no formulas
  client-side" rule: the backend only takes contributions. Keep them there.
- Filters live in the URL query (`useFilters()`), not in a store.
- Styling uses the EPFL design system only: its tokens, classes and Vue kit
  (`epfl-design-system/kits/vue`), no hex, no px (stylelint enforces it). It is
  vendored in `frontend/vendor/epfl-design-system/` (aliased, never edited; its
  README says how to update it), because its repository is private. Quasar sits
  in a lower cascade layer than the DS. Never mix in Vuetify.
- Open design questions carry a `handoff-Q<n>` marker: `grep -rn handoff- frontend/src`.
- Every user-facing string goes through `src/locales/en.json`.
