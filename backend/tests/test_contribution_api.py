import httpx
from enacit4r_contrib.testing import FakeRepo
from fastapi import FastAPI

from modernmasonrydatabase.config import settings
from modernmasonrydatabase.contribution import DATABASE_CSV, main
from modernmasonrydatabase.contribution_api import contribution_routes

from .test_contribution import COL, DATASET, _example, _kit

CONTRIBUTOR = {"name": "Ada Tester", "email": "ada@example.org", "institution": "Lab"}


def _settings(**values):
    s = settings.dynaconf_clone()
    for key in ("github_app_id", "github_app_private_key", "github_token"):
        s.set(key, None)
    for key, value in values.items():
        s.set(key, value)
    return s


def _client(repo=None, calls=None, **values) -> httpx.AsyncClient:
    async def load() -> bytes:
        if calls is not None:
            calls.append(1)
        return DATASET

    app = FastAPI()
    app.include_router(contribution_routes(_settings(**values), repo, load))
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    )


def _files(bundle: dict[str, bytes]) -> list:
    return [("files", (f"masonry_walls/{p}", data)) for p, data in bundle.items()]


async def test_validate_and_contribute_open_a_pr(tmp_path):
    repo = FakeRepo()
    async with _client(repo) as c:
        r = await c.post("/validate", files=_files(_kit()))
        assert r.status_code == 200
        assert r.json()["valid"] is True
        r = await c.post("/contributions", data=CONTRIBUTOR, files=_files(_kit()))
    assert r.status_code == 201, r.text
    id_ = r.json()["id"]
    assert len(repo.pulls) == 1
    assert repo.pulls[0]["base"] == "dev"
    files = repo.commits[0]["files"]
    assert all(p.startswith(f"submissions/{id_}/") for p in files)
    assert f"submissions/{id_}/{DATABASE_CSV}" in files
    assert f"submissions/{id_}/02_fd_curve/fd_curve_SW0.1-new.csv" in files
    for path, data in files.items():
        (tmp_path / path).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / path).write_bytes(data)
    assert main([str(tmp_path / "submissions" / id_)]) == 0


async def test_filled_n_is_refused():
    row = _example()
    row[COL["N"]] = "999"
    repo = FakeRepo()
    async with _client(repo) as c:
        r = await c.post("/contributions", data=CONTRIBUTOR, files=_files(_kit(row)))
    assert r.status_code == 422
    assert any("N_id" in i["message"] for i in r.json()["issues"]), r.text
    assert repo.pulls == []


async def test_no_credentials_closes_contributions_only():
    async with _client() as c:
        assert (await c.post("/validate", files=_files(_kit()))).status_code == 200
        r = await c.post("/contributions", data=CONTRIBUTOR, files=_files(_kit()))
    assert r.status_code == 503


async def test_dataset_is_cached():
    calls = []
    async with _client(calls=calls) as c:
        for _ in range(2):
            assert (await c.post("/validate", files=_files(_kit()))).status_code == 200
    assert calls == [1]


async def test_photos_are_skipped_not_committed():
    repo = FakeRepo()
    bundle = _kit(_example()) | {"07_fig_setup/fig_setup_SW0.1-new.jpg": b"\xff\xd8"}
    person = {"name": "Ada", "email": "ada@example.org", "institution": "EPFL"}
    async with _client(repo) as client:
        r = await client.post("/contributions", files=_files(bundle), data=person)
    assert r.status_code == 201
    skipped = [i for i in r.json()["issues"] if i["file"].startswith("07_")]
    assert [i["severity"] for i in skipped] == ["warning"]
    assert not any(p.endswith(".jpg") for p in repo.commits[0]["files"])
