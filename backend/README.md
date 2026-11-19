# Modern Masonry Walls DB backend

FastAPI, managed with [uv](https://docs.astral.sh/uv/). `make help` lists the
targets; `make dev` serves http://127.0.0.1:8000, docs at `/docs`.

It serves the contribution API: `POST /validate` and `POST /contributions`
(`modernmasonrydatabase/contribution_api.py`). The root README describes the
flow and the environment variables.
