# CLAUDE.md

Commands and layout: [README.md](README.md). Team rules: the ENAC IT4R
conventions (`it4r-agent-kit`); this file only adds what is specific here.

- The frontend is static and calls no backend. `backend/` is kept but unused.
- The dataset lives in `frontend/public/data/` (photos in git-lfs).
  `pnpm convert` turns its CSVs into `frontend/src/assets/data/*.json`; commit both.
- `src/api/dataset.ts` is the only module that reads the dataset.
- Derivations (drift, τ, bins, `fm_group`…) live in `src/lib/derive.ts`, ported
  from the handoff's `build_charts.py`. This overrides the IT4R "no formulas
  client-side" rule: there is no backend to hold them. Keep them there.
- Filters live in the URL query (`useFilters()`), not in a store.
- Styling uses the EPFL design system only: its tokens and classes, no hex, no px
  (stylelint enforces it). Quasar sits in a lower cascade layer than the DS.
- Open design questions carry a `handoff-Q<n>` marker: `grep -rn handoff- frontend/src`.
- Every user-facing string goes through `src/locales/en.json`.
