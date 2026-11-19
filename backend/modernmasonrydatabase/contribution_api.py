"""
The contribution API: POST /validate and POST /contributions (enacit4r-contrib).

A contribution becomes a pull request that adds `submissions/<id>/` on the
contributions base branch. The validator compares it with the published dataset.
"""

import logging
import time
from collections.abc import Awaitable, Callable

import httpx
from enacit4r_contrib.api import contribution_router
from enacit4r_contrib.github import GitHubRepo
from enacit4r_contrib.pipeline import Pipeline
from enacit4r_contrib.repo import Repo
from enacit4r_contrib.sinks import GitHubPRSink
from fastapi import APIRouter

from modernmasonrydatabase.contribution import ALLOW, DATABASE_CSV, SKIP, make_validator

log = logging.getLogger(__name__)

DATASET_TTL = 600.0  # seconds


def dataset_url(settings) -> str:
    return (
        f"https://raw.githubusercontent.com/{settings.contributions_repo}/"
        f"{settings.contributions_base}/frontend/public/data/{DATABASE_CSV}"
    )


def fetch_dataset(url: str) -> Callable[[], Awaitable[bytes]]:
    async def load() -> bytes:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    return load


def cached(
    load: Callable[[], Awaitable[bytes]], ttl: float = DATASET_TTL
) -> Callable[[], Awaitable[bytes]]:
    """Keep the dataset for `ttl` seconds. A failed refresh keeps the old copy."""
    data: bytes | None = None
    loaded_at = 0.0

    async def get() -> bytes:
        nonlocal data, loaded_at
        if data is not None and time.monotonic() - loaded_at < ttl:
            return data
        try:
            data = await load()
            loaded_at = time.monotonic()
        except Exception:
            if data is None:
                # /validate has no handler for this: it answers 500.
                log.exception("could not load the reference dataset, cannot validate")
                raise
            log.warning(
                "could not refresh the reference dataset, keeping the cached copy",
                exc_info=True,
            )
        return data

    return get


def github_repo(settings) -> Repo | None:
    """The contributions repository, or None when no credentials are set."""
    app = (
        settings.github_app_id,
        settings.github_app_private_key,
        settings.github_app_installation_id,
    )
    if not (all(app) or settings.github_token):
        return None
    return GitHubRepo(
        settings.contributions_repo,
        app_id=app[0],
        private_key=app[1],
        installation_id=app[2],
        token=settings.github_token,
    )


def contribution_routes(
    settings,
    repo: Repo | None = None,
    load_dataset: Callable[[], Awaitable[bytes]] | None = None,
) -> APIRouter:
    if repo is None:
        repo = github_repo(settings)
    load = load_dataset or fetch_dataset(dataset_url(settings))
    reviewers = [
        r.strip() for r in str(settings.contributions_reviewers).split(",") if r.strip()
    ]
    sink = GitHubPRSink(repo, base=settings.contributions_base, reviewers=reviewers)
    pipeline = Pipeline(
        make_validator(cached(load)),
        sink,
        max_open=settings.contributions_max_open,
    )
    return contribution_router(
        pipeline, enabled=repo is not None, allow=ALLOW, skip=SKIP
    )
