import hashlib
import shutil
from pathlib import Path

import pytest

from modernmasonrydatabase.contribution import (
    DATABASE_CSV,
    REFERENCE,
    SPECIMEN,
    check_submission,
)
from modernmasonrydatabase.ingest import IngestError, ingest, main
from tests.test_contribution import DATA, DATASET, NAME, _example, _kit, _rows


@pytest.fixture
def data(tmp_path: Path) -> Path:
    d = tmp_path / "data"
    d.mkdir()
    shutil.copy(DATA / DATABASE_CSV, d)
    for folder in DATA.glob("0[1-6]_*"):
        shutil.copytree(folder, d / folder.name)
    return d


def _max_n(data: Path) -> int:
    text = (data / DATABASE_CSV).read_text(encoding="utf-8-sig")
    return max(int(r.split(",")[0]) for r in text.splitlines()[4:] if r[:1].isdigit())


CRACKS = [c.strip() for c in _rows(DATASET)[3]].index("Crack measurements")


def proof_row() -> list[str]:
    """The kit's row with no crack photo flag: photos are not ingested yet."""
    row = _example()
    row[CRACKS] = "No"
    return row


def _write(
    tmp_path: Path, name: str = NAME, ref: str | None = None, cracks: str = "No"
) -> Path:
    row = _example()
    row[SPECIMEN] = name
    row[CRACKS] = cracks
    if ref:
        row[REFERENCE] = ref
    sub = tmp_path / "submissions" / name
    for p, b in _kit(row).items():
        p = p.replace(NAME, name)
        (sub / p).parent.mkdir(parents=True, exist_ok=True)
        (sub / p).write_bytes(b)
    return sub


def _tree(d: Path) -> dict[str, str]:
    return {
        p.relative_to(d).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in sorted(d.rglob("*"))
        if p.is_file()
    }


def test_ingest_kit(tmp_path, data):
    old = (data / DATABASE_CSV).read_bytes()
    n = _max_n(data) + 1
    sub = _write(tmp_path)
    assert ingest(sub, data) == [(NAME, n)]
    new = (data / DATABASE_CSV).read_bytes()
    assert new.startswith(old)
    added = new[len(old) :]
    assert added.count(b"\n") == 1 and added.endswith(b"\n")
    assert added.startswith(f"{n},{n},".encode())
    assert (data / f"02_fd_curve/fd_curve_{n:04d}.csv").exists()
    assert (data / f"03_envelope_Pavia/envelope_{n:04d}_pos.csv").exists()
    assert not [p for p in data.rglob(f"*{NAME}*")]
    assert not sub.exists()
    again = check_submission(_kit(), new)
    assert any(i.message == f"already in the database as N={n}" for i in again)


def test_two_submissions_do_not_conflict(tmp_path, data):
    n = _max_n(data)
    assert ingest(_write(tmp_path), data) == [(NAME, n + 1)]
    assert ingest(_write(tmp_path, NAME + "2"), data) == [(NAME + "2", n + 2)]


def test_unknown_reference_writes_nothing(tmp_path, data):
    before = _tree(data)
    sub = _write(tmp_path, ref="Nobody et al. (2099)")
    with pytest.raises(IngestError, match="add reference Nobody et al. \\(2099\\)"):
        ingest(sub, data)
    assert _tree(data) == before
    assert sub.exists()


def test_crack_photo_flag_writes_nothing(tmp_path, data):
    before = _tree(data)
    with pytest.raises(IngestError, match="Crack measurements"):
        ingest(_write(tmp_path, cracks="DIC"), data)
    assert _tree(data) == before


def test_existing_curve_file_writes_nothing(tmp_path, data):
    n = _max_n(data) + 1
    (data / f"02_fd_curve/fd_curve_{n:04d}.csv").write_bytes(b"x")
    before = _tree(data)
    with pytest.raises(IngestError, match="already exists"):
        ingest(_write(tmp_path), data)
    assert _tree(data) == before


def test_failing_check_writes_nothing(tmp_path, data):
    sub = _write(tmp_path)
    (sub / "02_fd_curve" / f"fd_curve_{NAME}.csv").write_bytes(b"bad")
    before = _tree(data)
    with pytest.raises(IngestError) as e:
        ingest(sub, data)
    assert e.value.issues
    assert _tree(data) == before


def test_cli_exit_codes(tmp_path, data, capsys):
    assert main([str(_write(tmp_path)), "--data", str(data)]) == 0
    assert f"ingested {NAME} as N=" in capsys.readouterr().out
    assert main([str(_write(tmp_path)), "--data", str(data)]) == 1
    assert "already in the database" in capsys.readouterr().out
