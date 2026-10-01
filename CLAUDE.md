# CLAUDE.md

Commands and layout: [README.md](README.md). Team rules: the ENAC IT4R
conventions (`it4r-agent-kit`); this file only adds what is specific here.

- Backend routes live at `/` (the ingress and the Vite proxy strip `/api`).
- The frontend reaches the backend only through `src/plugins/axios.ts`, via a
  module in `src/api/`.
- Every user-facing string goes through `src/locales/en.json`.
