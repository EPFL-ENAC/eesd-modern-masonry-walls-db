import csv
import io
from pathlib import Path

import httpx
from enacit4r_contrib.testing import FakeRepo
from fastapi import FastAPI
from mmw_data.validate import DATABASE_CSV, main

from modernmasonrydatabase.config import settings
from modernmasonrydatabase.contribution_api import contribution_routes

# From the data repository: the 4 header rows, the row of N_id 227 with its
# curve CSVs, and the row of N_id 1. Row 1 leaves "Crack measurements" blank,
# so the validator does not require that column. The tests need no network.
DATA = Path(__file__).parent / "fixtures"
DATASET = (DATA / DATABASE_CSV).read_bytes()
NAME = "SW0.1-new"


def _rows(data: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(data.decode("utf-8-sig"))))


def _csv(rows: list[list[str]]) -> bytes:
    out = io.StringIO()
    csv.writer(out, lineterminator="\r\n").writerows(rows)
    return ("\ufeff" + out.getvalue()).encode()


HEADER = _rows(DATASET)[:4]
COL = {n.strip(): j for j, n in enumerate(HEADER[3])}  # first occurrence


def _example() -> list[str]:
    row = next(r for r in _rows(DATASET)[4:] if r[1] == "227")
    row = ["", "", *row[2:5], NAME, *row[6:]]
    # SW0.1 has a crack method, which needs a photo the upload does not take yet.
    row[HEADER[3].index("Crack measurements")] = ""
    return row


def _kit(*rows: list[str]) -> dict[str, bytes]:
    bundle = {DATABASE_CSV: _csv(HEADER + list(rows or [_example()]))}
    bundle["README.txt"] = b"note"
    for p in DATA.glob("0[2-6]_*/*_0227*.csv"):
        rel = p.relative_to(DATA).as_posix().replace("0227", NAME)
        bundle[rel] = p.read_bytes()
    return bundle


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
    folder = str(tmp_path / "submissions" / id_)
    assert main([folder, "--dataset", str(DATA / DATABASE_CSV)]) == 0


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
